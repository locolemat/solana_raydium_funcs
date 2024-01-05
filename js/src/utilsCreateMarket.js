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
exports.createMarket = void 0;
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../config");
const util_1 = require("./util");
function createMarket(input) {
    return __awaiter(this, void 0, void 0, function* () {
        // -------- step 1: make instructions --------
        const createMarketInstruments = yield raydium_sdk_1.MarketV2.makeCreateMarketInstructionSimple({
            connection: config_1.connection,
            wallet: input.wallet.publicKey,
            baseInfo: input.baseToken,
            quoteInfo: input.quoteToken,
            lotSize: input.lotSize, // default 1
            tickSize: input.tickSize, // default 0.01
            dexProgramId: config_1.PROGRAMIDS.OPENBOOK_MARKET,
            makeTxVersion: config_1.makeTxVersion,
        });
        return { txids: yield (0, util_1.buildAndSendTx)(createMarketInstruments.innerTransactions) };
    });
}
exports.createMarket = createMarket;
function howToUse() {
    return __awaiter(this, void 0, void 0, function* () {
        const baseToken = new raydium_sdk_1.Token(raydium_sdk_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey(process.argv[2]), Number(process.argv[3]), process.argv[4], process.argv[4]);
        const quoteToken = new raydium_sdk_1.Token(raydium_sdk_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey(process.argv[5]), Number(process.argv[6]), process.argv[7], process.argv[7]);
        const lotSize = Number(process.argv[8]);
        const tickSize = Number(process.argv[9]);
        createMarket({
            baseToken,
            quoteToken,
            wallet: config_1.wallet,
            lotSize,
            tickSize
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
//# sourceMappingURL=utilsCreateMarket.js.map