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
const formatAmmKeys_1 = require("./formatAmmKeys");
const formatClmmKeys_1 = require("./formatClmmKeys");
const util_1 = require("./util");
function routeSwap(input) {
    return __awaiter(this, void 0, void 0, function* () {
        // -------- pre-action: fetch Clmm pools info and ammV2 pools info --------
        const clmmPools = yield (0, formatClmmKeys_1.formatClmmKeys)(config_1.PROGRAMIDS.CLMM.toString()); // If the clmm pool is not required for routing, then this variable can be configured as undefined
        const clmmList = Object.values(yield raydium_sdk_1.Clmm.fetchMultiplePoolInfos({ connection: config_1.connection, poolKeys: clmmPools, chainTime: new Date().getTime() / 1000 })).map((i) => i.state);
        const sPool = yield (0, formatAmmKeys_1.formatAmmKeysToApi)(config_1.PROGRAMIDS.AmmV4.toString(), true); // If the Liquidity pool is not required for routing, then this variable can be configured as undefined
        // -------- step 1: get all route --------
        const getRoute = raydium_sdk_1.TradeV2.getAllRoute({
            inputMint: input.inputToken instanceof raydium_sdk_1.Token ? input.inputToken.mint : web3_js_1.PublicKey.default,
            outputMint: input.outputToken instanceof raydium_sdk_1.Token ? input.outputToken.mint : web3_js_1.PublicKey.default,
            apiPoolList: sPool,
            clmmList,
        });
        // -------- step 2: fetch tick array and pool info --------
        const [tickCache, poolInfosCache] = yield Promise.all([
            yield raydium_sdk_1.Clmm.fetchMultiplePoolTickArrays({ connection: config_1.connection, poolKeys: getRoute.needTickArray, batchRequest: true }),
            yield raydium_sdk_1.TradeV2.fetchMultipleInfo({ connection: config_1.connection, pools: getRoute.needSimulate, batchRequest: true }),
        ]);
        // -------- step 3: calculation result of all route --------
        const [routeInfo] = raydium_sdk_1.TradeV2.getAllRouteComputeAmountOut({
            directPath: getRoute.directPath,
            routePathDict: getRoute.routePathDict,
            simulateCache: poolInfosCache,
            tickCache,
            inputTokenAmount: input.inputTokenAmount,
            outputToken: input.outputToken,
            slippage: input.slippage,
            chainTime: new Date().getTime() / 1000, // this chain time
            feeConfig: input.feeConfig,
            mintInfos: yield (0, raydium_sdk_1.fetchMultipleMintInfos)({ connection: config_1.connection, mints: [
                    ...clmmPools.map(i => [{ mint: i.mintA, program: i.mintProgramIdA }, { mint: i.mintB, program: i.mintProgramIdB }]).flat().filter(i => i.program === spl_token_1.TOKEN_2022_PROGRAM_ID.toString()).map(i => new web3_js_1.PublicKey(i.mint)),
                ] }),
            epochInfo: yield config_1.connection.getEpochInfo(),
        });
        // -------- step 4: create instructions by SDK function --------
        const { innerTransactions } = yield raydium_sdk_1.TradeV2.makeSwapInstructionSimple({
            routeProgram: config_1.PROGRAMIDS.Router,
            connection: config_1.connection,
            swapInfo: routeInfo,
            ownerInfo: {
                wallet: input.wallet.publicKey,
                tokenAccounts: input.walletTokenAccounts,
                associatedOnly: true,
                checkCreateATAOwner: true,
            },
            computeBudgetConfig: {
                units: 400000, // compute instruction
                microLamports: 1, // fee add 1 * 400000 / 10 ** 9 SOL
            },
            makeTxVersion: config_1.makeTxVersion,
        });
        return { txids: yield (0, util_1.buildAndSendTx)(innerTransactions) };
    });
}
function howToUse() {
    return __awaiter(this, void 0, void 0, function* () {
        // sol -> new Currency(9, 'SOL', 'SOL')
        const outputToken = config_1.DEFAULT_TOKEN.USDC; // USDC
        const inputToken = config_1.DEFAULT_TOKEN.RAY; // RAY
        // const inputToken = new Currency(9, 'SOL', 'SOL')
        const inputTokenAmount = new (inputToken instanceof raydium_sdk_1.Token ? raydium_sdk_1.TokenAmount : raydium_sdk_1.CurrencyAmount)(inputToken, 100);
        const slippage = new raydium_sdk_1.Percent(1, 100);
        const walletTokenAccounts = yield (0, util_1.getWalletTokenAccount)(config_1.connection, config_1.wallet.publicKey);
        routeSwap({
            inputToken,
            outputToken,
            inputTokenAmount,
            slippage,
            walletTokenAccounts,
            wallet: config_1.wallet,
            // feeConfig: {
            //   feeBps: new BN(25),
            //   feeAccount: Keypair.generate().publicKey // test
            // }
        }).then(({ txids }) => {
            /** continue with txids */
            console.log('txids', txids);
        });
    });
}
howToUse();
//# sourceMappingURL=swapRoute.js.map