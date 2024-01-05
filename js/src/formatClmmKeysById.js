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
exports.formatClmmKeysById = void 0;
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../config");
const formatClmmConfigs_1 = require("./formatClmmConfigs");
const formatClmmKeys_1 = require("./formatClmmKeys");
function getMintProgram(mint) {
    return __awaiter(this, void 0, void 0, function* () {
        const account = yield config_1.connection.getAccountInfo(mint);
        if (account === null)
            throw Error(' get id info error ');
        return account.owner;
    });
}
function getConfigInfo(configId) {
    return __awaiter(this, void 0, void 0, function* () {
        const account = yield config_1.connection.getAccountInfo(configId);
        if (account === null)
            throw Error(' get id info error ');
        return (0, formatClmmConfigs_1.formatConfigInfo)(configId, account);
    });
}
function formatClmmKeysById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const account = yield config_1.connection.getAccountInfo(new web3_js_1.PublicKey(id));
        if (account === null)
            throw Error(' get id info error ');
        const info = raydium_sdk_1.PoolInfoLayout.decode(account.data);
        return {
            id,
            mintProgramIdA: (yield getMintProgram(info.mintA)).toString(),
            mintProgramIdB: (yield getMintProgram(info.mintB)).toString(),
            mintA: info.mintA.toString(),
            mintB: info.mintB.toString(),
            vaultA: info.vaultA.toString(),
            vaultB: info.vaultB.toString(),
            mintDecimalsA: info.mintDecimalsA,
            mintDecimalsB: info.mintDecimalsB,
            ammConfig: yield getConfigInfo(info.ammConfig),
            rewardInfos: yield Promise.all(info.rewardInfos
                .filter((i) => !i.tokenMint.equals(web3_js_1.PublicKey.default))
                .map((i) => __awaiter(this, void 0, void 0, function* () {
                return ({
                    mint: i.tokenMint.toString(),
                    programId: (yield getMintProgram(i.tokenMint)).toString(),
                });
            }))),
            tvl: 0,
            day: (0, formatClmmKeys_1.getApiClmmPoolsItemStatisticsDefault)(),
            week: (0, formatClmmKeys_1.getApiClmmPoolsItemStatisticsDefault)(),
            month: (0, formatClmmKeys_1.getApiClmmPoolsItemStatisticsDefault)(),
            lookupTableAccount: web3_js_1.PublicKey.default.toBase58(),
        };
    });
}
exports.formatClmmKeysById = formatClmmKeysById;
//# sourceMappingURL=formatClmmKeysById.js.map