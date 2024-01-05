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
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../config");
function getClmmPoolInfo() {
    return __awaiter(this, void 0, void 0, function* () {
        const id = new web3_js_1.PublicKey('< pool id >');
        const accountInfo = yield config_1.connection.getAccountInfo(id);
        if (accountInfo === null)
            throw Error(' get pool info error ');
        const poolData = raydium_sdk_1.PoolInfoLayout.decode(accountInfo.data);
        console.log('current price -> ', raydium_sdk_1.SqrtPriceMath.sqrtPriceX64ToPrice(poolData.sqrtPriceX64, poolData.mintDecimalsA, poolData.mintDecimalsB));
    });
}
getClmmPoolInfo();
//# sourceMappingURL=getClmmPoolInfo.js.map