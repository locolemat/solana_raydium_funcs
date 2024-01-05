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
exports._d = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const decimal_js_1 = __importDefault(require("decimal.js"));
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const config_1 = require("../config");
const formatClmmKeysById_1 = require("./formatClmmKeysById");
function _d(poolInfo, amount, type) {
    const decimal = poolInfo[type === 'A' ? 'mintA' : 'mintB'].decimals;
    return new decimal_js_1.default(amount.toString()).div(new decimal_js_1.default(10).pow(decimal));
}
exports._d = _d;
function getOutOfRangePositionOutAmount() {
    return __awaiter(this, void 0, void 0, function* () {
        const poolId = ''; // need change
        const poolKey = yield (0, formatClmmKeysById_1.formatClmmKeysById)(poolId);
        const poolInfo = (yield raydium_sdk_1.Clmm.fetchMultiplePoolInfos({ connection: config_1.connection, poolKeys: [poolKey], chainTime: new Date().getTime() / 1000, }))[poolId].state;
        const priceLower = new decimal_js_1.default(10); // need change
        const priceUpper = new decimal_js_1.default(30); // need change
        const inputAmount = new decimal_js_1.default(100); // need change
        const inputAmountMint = poolInfo.mintA; // need change
        const tickLower = raydium_sdk_1.Clmm.getPriceAndTick({ poolInfo, price: priceLower, baseIn: true }).tick;
        const tickUpper = raydium_sdk_1.Clmm.getPriceAndTick({ poolInfo, price: priceUpper, baseIn: true }).tick;
        const token2022Infos = yield (0, raydium_sdk_1.fetchMultipleMintInfos)({ connection: config_1.connection, mints: [poolInfo.mintA.mint, poolInfo.mintB.mint] });
        const epochInfo = yield config_1.connection.getEpochInfo();
        const liquidityInfo = yield raydium_sdk_1.Clmm.getLiquidityAmountOutFromAmountIn({
            poolInfo,
            inputA: inputAmountMint.mint.equals(poolInfo.mintA.mint),
            tickLower,
            tickUpper,
            amount: new bn_js_1.default(inputAmount.mul(new decimal_js_1.default(10).pow(inputAmountMint.decimals)).toFixed(0)),
            slippage: 0,
            add: true,
            amountHasFee: true,
            token2022Infos,
            epochInfo,
        });
        const amountLower = raydium_sdk_1.Clmm.getAmountsFromLiquidity({
            poolInfo: Object.assign(Object.assign({}, poolInfo), { sqrtPriceX64: raydium_sdk_1.SqrtPriceMath.getSqrtPriceX64FromTick(tickLower) }),
            tickLower,
            tickUpper,
            liquidity: liquidityInfo.liquidity,
            slippage: 0,
            add: false,
            token2022Infos,
            epochInfo,
            amountAddFee: false,
        });
        const amountUpper = raydium_sdk_1.Clmm.getAmountsFromLiquidity({
            poolInfo: Object.assign(Object.assign({}, poolInfo), { sqrtPriceX64: raydium_sdk_1.SqrtPriceMath.getSqrtPriceX64FromTick(tickUpper) }),
            tickLower,
            tickUpper,
            liquidity: liquidityInfo.liquidity,
            slippage: 0,
            add: false,
            token2022Infos,
            epochInfo,
            amountAddFee: false
        });
        console.log(`create position info -> liquidity: ${liquidityInfo.liquidity.toString()} amountA: ${_d(poolInfo, liquidityInfo.amountA.amount, 'A')} amountB: ${_d(poolInfo, liquidityInfo.amountB.amount, 'B')}`);
        console.log(`out of range position(lower) info -> liquidity: ${amountLower.liquidity.toString()} amountA: ${_d(poolInfo, amountLower.amountA.amount, 'A')} amountB: ${_d(poolInfo, amountLower.amountB.amount, 'B')}`);
        console.log(`out of range position(upper) info -> liquidity: ${amountUpper.liquidity.toString()} amountA: ${_d(poolInfo, amountUpper.amountA.amount, 'A')} amountB: ${_d(poolInfo, amountUpper.amountB.amount, 'B')}`);
    });
}
//# sourceMappingURL=getOutOfRangePositionOutAmount.js.map