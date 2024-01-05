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
exports.formatAmmKeysToApi = exports.formatAmmKeys = void 0;
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../config");
function formatAmmKeys(programId, findLookupTableAddress = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const filterDefKey = web3_js_1.PublicKey.default.toString();
        const allAmmAccount = yield config_1.connection.getProgramAccounts(new web3_js_1.PublicKey(programId), { filters: [{ dataSize: raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.span }] });
        const amAccountmData = allAmmAccount.map(i => (Object.assign({ id: i.pubkey, programId: i.account.owner }, raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.decode(i.account.data)))).filter(i => i.marketProgramId.toString() !== filterDefKey);
        const allMarketProgram = new Set(amAccountmData.map(i => i.marketProgramId.toString()));
        const marketInfo = {};
        for (const itemMarketProgram of allMarketProgram) {
            const allMarketInfo = yield config_1.connection.getProgramAccounts(new web3_js_1.PublicKey(itemMarketProgram), { filters: [{ dataSize: raydium_sdk_1.MARKET_STATE_LAYOUT_V3.span }] });
            for (const itemAccount of allMarketInfo) {
                const itemMarketInfo = raydium_sdk_1.MARKET_STATE_LAYOUT_V3.decode(itemAccount.account.data);
                marketInfo[itemAccount.pubkey.toString()] = {
                    marketProgramId: itemAccount.account.owner.toString(),
                    marketAuthority: raydium_sdk_1.Market.getAssociatedAuthority({ programId: itemAccount.account.owner, marketId: itemAccount.pubkey }).publicKey.toString(),
                    marketBaseVault: itemMarketInfo.baseVault.toString(),
                    marketQuoteVault: itemMarketInfo.quoteVault.toString(),
                    marketBids: itemMarketInfo.bids.toString(),
                    marketAsks: itemMarketInfo.asks.toString(),
                    marketEventQueue: itemMarketInfo.eventQueue.toString()
                };
            }
        }
        const ammFormatData = amAccountmData.map(itemAmm => {
            const itemMarket = marketInfo[itemAmm.marketId.toString()];
            if (itemMarket === undefined)
                return undefined;
            const format = Object.assign(Object.assign({ id: itemAmm.id.toString(), baseMint: itemAmm.baseMint.toString(), quoteMint: itemAmm.quoteMint.toString(), lpMint: itemAmm.lpMint.toString(), baseDecimals: itemAmm.baseDecimal.toNumber(), quoteDecimals: itemAmm.quoteDecimal.toNumber(), lpDecimals: itemAmm.baseDecimal.toNumber(), version: 4, programId: itemAmm.programId.toString(), authority: raydium_sdk_1.Liquidity.getAssociatedAuthority({ programId: itemAmm.programId }).publicKey.toString(), openOrders: itemAmm.openOrders.toString(), targetOrders: itemAmm.targetOrders.toString(), baseVault: itemAmm.baseVault.toString(), quoteVault: itemAmm.quoteVault.toString(), withdrawQueue: itemAmm.withdrawQueue.toString(), lpVault: itemAmm.lpVault.toString(), marketVersion: 3, marketId: itemAmm.marketId.toString() }, itemMarket), { lookupTableAccount: filterDefKey });
            return format;
        }).filter(i => i !== undefined).reduce((a, b) => { a[b.id] = b; return a; }, {});
        if (findLookupTableAddress) {
            const ltas = yield config_1.connection.getProgramAccounts(new web3_js_1.PublicKey('AddressLookupTab1e1111111111111111111111111'), {
                filters: [{ memcmp: { offset: 22, bytes: 'RayZuc5vEK174xfgNFdD9YADqbbwbFjVjY4NM8itSF9' } }]
            });
            for (const itemLTA of ltas) {
                const keyStr = itemLTA.pubkey.toString();
                const ltaForamt = new web3_js_1.AddressLookupTableAccount({ key: itemLTA.pubkey, state: web3_js_1.AddressLookupTableAccount.deserialize(itemLTA.account.data) });
                for (const itemKey of ltaForamt.state.addresses) {
                    const itemKeyStr = itemKey.toString();
                    if (ammFormatData[itemKeyStr] === undefined)
                        continue;
                    ammFormatData[itemKeyStr].lookupTableAccount = keyStr;
                }
            }
        }
        return Object.values(ammFormatData);
    });
}
exports.formatAmmKeys = formatAmmKeys;
function formatAmmKeysToApi(programId, findLookupTableAddress = false) {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            official: [],
            unOfficial: yield formatAmmKeys(programId, findLookupTableAddress)
        };
    });
}
exports.formatAmmKeysToApi = formatAmmKeysToApi;
//# sourceMappingURL=formatAmmKeys.js.map