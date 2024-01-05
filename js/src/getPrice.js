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
const web3_js_1 = require("@solana/web3.js");
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const config_1 = require("../config");
const formatAmmKeysById_1 = require("./formatAmmKeysById");
function grabPrice() {
    return __awaiter(this, void 0, void 0, function* () {
        const targetPoolInfo = yield (0, formatAmmKeysById_1.formatAmmKeysById)(process.argv[2]);
        (0, assert_1.default)(targetPoolInfo, 'cannot find the target pool');
        const poolKeys = (0, raydium_sdk_1.jsonInfo2PoolKeys)(targetPoolInfo);
        const inputToken = new raydium_sdk_1.Token(raydium_sdk_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey(process.argv[3]), Number(process.argv[4]), process.argv[5], process.argv[5]);
        const outputToken = new raydium_sdk_1.Token(raydium_sdk_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey(process.argv[6]), Number(process.argv[7]), process.argv[8], process.argv[8]);
        const inputTokenAmount = new raydium_sdk_1.TokenAmount(inputToken, Number(process.argv[9]));
        const slippage = new raydium_sdk_1.Percent(1, 100);
        const { amountOut, minAmountOut } = raydium_sdk_1.Liquidity.computeAmountOut({
            poolKeys: poolKeys,
            poolInfo: yield raydium_sdk_1.Liquidity.fetchInfo({ connection: config_1.connection, poolKeys }),
            amountIn: inputTokenAmount,
            currencyOut: outputToken,
            slippage: slippage,
        });
        console.log(minAmountOut);
    });
}
function howToUse() {
    return __awaiter(this, void 0, void 0, function* () {
        yield grabPrice();
    });
}
howToUse();
//# sourceMappingURL=getPrice.js.map