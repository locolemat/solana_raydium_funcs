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
function generateV4PoolInfo() {
    return __awaiter(this, void 0, void 0, function* () {
        // RAY-USDC
        const poolInfo = raydium_sdk_1.Liquidity.getAssociatedPoolKeys({
            version: 4,
            marketVersion: 3,
            baseMint: new web3_js_1.PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'),
            quoteMint: new web3_js_1.PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
            baseDecimals: 6,
            quoteDecimals: 6,
            programId: new web3_js_1.PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'),
            marketId: new web3_js_1.PublicKey('DZjbn4XC8qoHKikZqzmhemykVzmossoayV9ffbsUqxVj'),
            marketProgramId: new web3_js_1.PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'),
        });
        return { poolInfo };
    });
}
function howToUse() {
    return __awaiter(this, void 0, void 0, function* () {
        generateV4PoolInfo().then(({ poolInfo }) => {
            console.log('poolInfo: ', poolInfo);
            console.log(poolInfo);
        });
    });
}
howToUse();
//# sourceMappingURL=ammV4MockPoolInfo.js.map