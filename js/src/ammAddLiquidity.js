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
const decimal_js_1 = __importDefault(require("decimal.js"));
const config_1 = require("../config");
const formatAmmKeysById_1 = require("./formatAmmKeysById");
const util_1 = require("./util");
function ammAddLiquidity(input) {
    return __awaiter(this, void 0, void 0, function* () {
        const targetPoolInfo = yield (0, formatAmmKeysById_1.formatAmmKeysById)(input.targetPool);
        (0, assert_1.default)(targetPoolInfo, 'cannot find the target pool');
        // -------- step 1: compute another amount --------
        const poolKeys = (0, raydium_sdk_1.jsonInfo2PoolKeys)(targetPoolInfo);
        const extraPoolInfo = yield raydium_sdk_1.Liquidity.fetchInfo({ connection: config_1.connection, poolKeys });
        const { maxAnotherAmount, anotherAmount, liquidity } = raydium_sdk_1.Liquidity.computeAnotherAmount({
            poolKeys,
            poolInfo: Object.assign(Object.assign({}, targetPoolInfo), extraPoolInfo),
            amount: input.inputTokenAmount,
            anotherCurrency: input.quoteToken,
            slippage: input.slippage,
        });
        console.log('will add liquidity info', {
            liquidity: liquidity.toString(),
            liquidityD: new decimal_js_1.default(liquidity.toString()).div(Math.pow(10, extraPoolInfo.lpDecimals)),
        });
        // -------- step 2: make instructions --------
        const addLiquidityInstructionResponse = yield raydium_sdk_1.Liquidity.makeAddLiquidityInstructionSimple({
            connection: config_1.connection,
            poolKeys,
            userKeys: {
                owner: input.wallet.publicKey,
                payer: input.wallet.publicKey,
                tokenAccounts: input.walletTokenAccounts,
            },
            amountInA: input.inputTokenAmount,
            amountInB: maxAnotherAmount,
            fixedSide: 'a',
            makeTxVersion: config_1.makeTxVersion,
        });
        return { txids: yield (0, util_1.buildAndSendTx)(addLiquidityInstructionResponse.innerTransactions), anotherAmount };
    });
}
function howToUse() {
    return __awaiter(this, void 0, void 0, function* () {
        const baseToken = config_1.DEFAULT_TOKEN.USDC; // USDC
        const quoteToken = config_1.DEFAULT_TOKEN.RAY; // RAY
        const targetPool = 'EVzLJhqMtdC1nPmz8rNd6xGfVjDPxpLZgq7XJuNfMZ6'; // RAY-USDC pool
        const inputTokenAmount = new raydium_sdk_1.TokenAmount(baseToken, 100);
        const slippage = new raydium_sdk_1.Percent(1, 100);
        const walletTokenAccounts = yield (0, util_1.getWalletTokenAccount)(config_1.connection, config_1.wallet.publicKey);
        ammAddLiquidity({
            baseToken,
            quoteToken,
            targetPool,
            inputTokenAmount,
            slippage,
            walletTokenAccounts,
            wallet: config_1.wallet,
        }).then(({ txids, anotherAmount }) => {
            /** continue with txids */
            console.log('txids', txids);
        });
    });
}
//# sourceMappingURL=ammAddLiquidity.js.map