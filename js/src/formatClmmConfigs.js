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
exports.formatClmmConfigs = exports.formatConfigInfo = void 0;
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../config");
function formatConfigInfo(id, account) {
    const info = raydium_sdk_1.AmmConfigLayout.decode(account.data);
    return {
        id: id.toBase58(),
        index: info.index,
        protocolFeeRate: info.protocolFeeRate,
        tradeFeeRate: info.tradeFeeRate,
        tickSpacing: info.tickSpacing,
        fundFeeRate: info.fundFeeRate,
        fundOwner: info.fundOwner.toString(),
        description: '',
    };
}
exports.formatConfigInfo = formatConfigInfo;
function formatClmmConfigs(programId) {
    return __awaiter(this, void 0, void 0, function* () {
        const configAccountInfo = yield config_1.connection.getProgramAccounts(new web3_js_1.PublicKey(programId), { filters: [{ dataSize: raydium_sdk_1.AmmConfigLayout.span }] });
        return configAccountInfo.map(i => formatConfigInfo(i.pubkey, i.account)).reduce((a, b) => { a[b.id] = b; return a; }, {});
    });
}
exports.formatClmmConfigs = formatClmmConfigs;
//# sourceMappingURL=formatClmmConfigs.js.map