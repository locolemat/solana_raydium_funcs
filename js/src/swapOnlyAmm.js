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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../config");
const formatAmmKeysById_1 = require("./formatAmmKeysById");
const util_1 = require("./util");
function swapOnlyAmm(input) {
    return __awaiter(this, void 0, void 0, function* () {
        // -------- pre-action: get pool info --------
        const targetPoolInfo = yield (0, formatAmmKeysById_1.formatAmmKeysById)(input.targetPool);
        (0, assert_1.default)(targetPoolInfo, 'cannot find the target pool');
        const poolKeys = (0, raydium_sdk_1.jsonInfo2PoolKeys)(targetPoolInfo);
        // -------- step 1: coumpute amount out --------
        const { amountOut, minAmountOut } = raydium_sdk_1.Liquidity.computeAmountOut({
            poolKeys: poolKeys,
            poolInfo: yield raydium_sdk_1.Liquidity.fetchInfo({ connection: config_1.connection, poolKeys }),
            amountIn: input.inputTokenAmount,
            currencyOut: input.outputToken,
            slippage: input.slippage,
        });
        // -------- step 2: create instructions by SDK function --------
        const { innerTransactions } = yield raydium_sdk_1.Liquidity.makeSwapInstructionSimple({
            connection: config_1.connection,
            poolKeys,
            userKeys: {
                tokenAccounts: input.walletTokenAccounts,
                owner: input.wallet.publicKey,
            },
            amountIn: input.inputTokenAmount,
            amountOut: minAmountOut,
            fixedSide: 'in',
            makeTxVersion: config_1.makeTxVersion,
        });
        console.log('amountOut:', amountOut.toFixed(), '  minAmountOut: ', minAmountOut.toFixed());
        return { txids: yield (0, util_1.buildAndSendTx)(innerTransactions) };
    });
}
function howToUse() {
    return __awaiter(this, void 0, void 0, function* () {
        /*
        const inputToken = DEFAULT_TOKEN.USDC // USDC
        const outputToken = DEFAULT_TOKEN.RAY // RAY
        const targetPool = 'EVzLJhqMtdC1nPmz8rNd6xGfVjDPxpLZgq7XJuNfMZ6' // USDC-RAY pool
        const inputTokenAmount = new TokenAmount(inputToken, 10000)
        const slippage = new Percent(1, 100)
        const walletTokenAccounts = await getWalletTokenAccount(connection, wallet.publicKey)
        */
        const inputToken = new raydium_sdk_1.Token(raydium_sdk_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey(process.argv[2]), Number(process.argv[3]), process.argv[4], process.argv[4]); // USDC
        const outputToken = new raydium_sdk_1.Token(raydium_sdk_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey(process.argv[5]), Number(process.argv[6]), process.argv[7], process.argv[7]); // RAY
        const targetPool = process.argv[8]; // USDC-RAY pool
        const inputTokenAmount = new raydium_sdk_1.TokenAmount(inputToken, Number(process.argv[9]));
        const slippage = new raydium_sdk_1.Percent(1, 100);
        const walletTokenAccounts = yield (0, util_1.getWalletTokenAccount)(config_1.connection, config_1.wallet.publicKey);
        swapOnlyAmm({
            outputToken,
            targetPool,
            inputTokenAmount,
            slippage,
            walletTokenAccounts,
            wallet: config_1.wallet,
        }).then(({ txids }) => {
            /** continue with txids */
            console.log('txids', txids);
        })
            .catch((error) => {
            console.error('ERROR:', error);
        });
    });
}
howToUse();
//# sourceMappingURL=swapOnlyAmm.js.map