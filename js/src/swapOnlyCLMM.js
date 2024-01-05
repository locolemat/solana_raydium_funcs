"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../config");
const formatClmmKeysById_1 = require("./formatClmmKeysById");
const util_1 = require("./util");
function swapOnlyCLMM(input) {
    return __awaiter(this, void 0, void 0, function* () {
        // -------- pre-action: fetch Clmm pools info --------
        const clmmPools = [yield (0, formatClmmKeysById_1.formatClmmKeysById)(input.targetPool)];
        const { [input.targetPool]: clmmPoolInfo } = yield raydium_sdk_1.Clmm.fetchMultiplePoolInfos({
            connection: config_1.connection,
            poolKeys: clmmPools,
            chainTime: new Date().getTime() / 1000,
        });
        // -------- step 1: fetch tick array --------
        const tickCache = yield raydium_sdk_1.Clmm.fetchMultiplePoolTickArrays({
            connection: config_1.connection,
            poolKeys: [clmmPoolInfo.state],
            batchRequest: true,
        });
        // -------- step 2: calc amount out by SDK function --------
        // Configure input/output parameters, in this example, this token amount will swap 0.0001 USDC to RAY
        const { minAmountOut, remainingAccounts } = raydium_sdk_1.Clmm.computeAmountOutFormat({
            poolInfo: clmmPoolInfo.state,
            tickArrayCache: tickCache[input.targetPool],
            amountIn: input.inputTokenAmount,
            currencyOut: input.outputToken,
            slippage: input.slippage,
            epochInfo: yield config_1.connection.getEpochInfo(),
            token2022Infos: yield (0, raydium_sdk_1.fetchMultipleMintInfos)({
                connection: config_1.connection, mints: [
                    ...clmmPools.map(i => [{ mint: i.mintA, program: i.mintProgramIdA }, { mint: i.mintB, program: i.mintProgramIdB }]).flat().filter(i => i.program === spl_token_1.TOKEN_2022_PROGRAM_ID.toString()).map(i => new web3_js_1.PublicKey(i.mint)),
                ]
            }),
            catchLiquidityInsufficient: false,
        });
        // -------- step 3: create instructions by SDK function --------
        const { innerTransactions } = yield raydium_sdk_1.Clmm.makeSwapBaseInInstructionSimple({
            connection: config_1.connection,
            poolInfo: clmmPoolInfo.state,
            ownerInfo: {
                feePayer: input.wallet.publicKey,
                wallet: input.wallet.publicKey,
                tokenAccounts: input.walletTokenAccounts,
            },
            inputMint: input.inputTokenAmount.token.mint,
            amountIn: input.inputTokenAmount.raw,
            amountOutMin: minAmountOut.amount.raw,
            remainingAccounts,
            makeTxVersion: config_1.makeTxVersion,
        });
        return { txids: yield (0, util_1.buildAndSendTx)(innerTransactions) };
    });
}
function howToUse() {
    return __awaiter(this, void 0, void 0, function* () {
        const inputToken = config_1.DEFAULT_TOKEN.USDC; // USDC
        const outputToken = config_1.DEFAULT_TOKEN.RAY; // RAY
        const targetPool = '61R1ndXxvsWXXkWSyNkCxnzwd3zUNB8Q2ibmkiLPC8ht'; // USDC-RAY pool
        const inputTokenAmount = new raydium_sdk_1.TokenAmount(inputToken, 100);
        const slippage = new raydium_sdk_1.Percent(1, 100);
        const walletTokenAccounts = yield (0, util_1.getWalletTokenAccount)(config_1.connection, config_1.wallet.publicKey);
        swapOnlyCLMM({
            outputToken,
            targetPool,
            inputTokenAmount,
            slippage,
            walletTokenAccounts,
            wallet: config_1.wallet,
        }).then(({ txids }) => {
            /** continue with txids */
            console.log('txids', txids);
        });
    });
}
//# sourceMappingURL=swapOnlyCLMM.js.map