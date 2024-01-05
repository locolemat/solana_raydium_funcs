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
exports.formatClmmKeys = exports.getApiClmmPoolsItemStatisticsDefault = void 0;
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../config");
const formatClmmConfigs_1 = require("./formatClmmConfigs");
function getApiClmmPoolsItemStatisticsDefault() {
    return {
        volume: 0,
        volumeFee: 0,
        feeA: 0,
        feeB: 0,
        feeApr: 0,
        rewardApr: { A: 0, B: 0, C: 0 },
        apr: 0,
        priceMin: 0,
        priceMax: 0,
    };
}
exports.getApiClmmPoolsItemStatisticsDefault = getApiClmmPoolsItemStatisticsDefault;
function formatClmmKeys(programId, findLookupTableAddress = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const filterDefKey = web3_js_1.PublicKey.default.toString();
        const poolAccountInfo = yield config_1.connection.getProgramAccounts(new web3_js_1.PublicKey(programId), { filters: [{ dataSize: raydium_sdk_1.PoolInfoLayout.span }] });
        const configIdToData = yield (0, formatClmmConfigs_1.formatClmmConfigs)(programId);
        const poolAccountFormat = poolAccountInfo.map(i => (Object.assign({ id: i.pubkey }, raydium_sdk_1.PoolInfoLayout.decode(i.account.data))));
        const allMint = [...new Set(poolAccountFormat.map(i => [i.mintA.toString(), i.mintB.toString(), ...i.rewardInfos.map(ii => ii.tokenMint.toString())]).flat())].filter(i => i !== filterDefKey).map(i => ({ pubkey: new web3_js_1.PublicKey(i) }));
        const mintAccount = yield (0, raydium_sdk_1.getMultipleAccountsInfoWithCustomFlags)(config_1.connection, allMint);
        const mintInfoDict = mintAccount.filter(i => i.accountInfo !== null).reduce((a, b) => { a[b.pubkey.toString()] = { programId: b.accountInfo.owner.toString() }; return a; }, {});
        const poolInfoDict = poolAccountFormat.map(i => {
            const mintProgramIdA = mintInfoDict[i.mintA.toString()].programId;
            const mintProgramIdB = mintInfoDict[i.mintB.toString()].programId;
            const rewardInfos = i.rewardInfos
                .filter((i) => !i.tokenMint.equals(web3_js_1.PublicKey.default))
                .map((i) => ({
                mint: i.tokenMint.toString(),
                programId: mintInfoDict[i.tokenMint.toString()].programId,
            }));
            return {
                id: i.id.toString(),
                mintProgramIdA,
                mintProgramIdB,
                mintA: i.mintA.toString(),
                mintB: i.mintB.toString(),
                vaultA: i.vaultA.toString(),
                vaultB: i.vaultB.toString(),
                mintDecimalsA: i.mintDecimalsA,
                mintDecimalsB: i.mintDecimalsB,
                ammConfig: configIdToData[i.ammConfig.toString()],
                rewardInfos,
                tvl: 0,
                day: getApiClmmPoolsItemStatisticsDefault(),
                week: getApiClmmPoolsItemStatisticsDefault(),
                month: getApiClmmPoolsItemStatisticsDefault(),
                lookupTableAccount: web3_js_1.PublicKey.default.toBase58(),
            };
        }).reduce((a, b) => { a[b.id] = b; return a; }, {});
        if (findLookupTableAddress) {
            const ltas = yield config_1.connection.getProgramAccounts(new web3_js_1.PublicKey('AddressLookupTab1e1111111111111111111111111'), {
                filters: [{ memcmp: { offset: 22, bytes: 'RayZuc5vEK174xfgNFdD9YADqbbwbFjVjY4NM8itSF9' } }]
            });
            for (const itemLTA of ltas) {
                const keyStr = itemLTA.pubkey.toString();
                const ltaForamt = new web3_js_1.AddressLookupTableAccount({ key: itemLTA.pubkey, state: web3_js_1.AddressLookupTableAccount.deserialize(itemLTA.account.data) });
                for (const itemKey of ltaForamt.state.addresses) {
                    const itemKeyStr = itemKey.toString();
                    if (poolInfoDict[itemKeyStr] === undefined)
                        continue;
                    poolInfoDict[itemKeyStr].lookupTableAccount = keyStr;
                }
            }
        }
        return Object.values(poolInfoDict);
    });
}
exports.formatClmmKeys = formatClmmKeys;
//# sourceMappingURL=formatClmmKeys.js.map