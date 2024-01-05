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
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const web3_js_1 = require("@solana/web3.js");
const yellowstone_grpc_1 = __importDefault(require("@triton-one/yellowstone-grpc"));
const bs58_1 = __importDefault(require("bs58"));
const config_1 = require("../config");
function subNewAmmPool() {
    return __awaiter(this, void 0, void 0, function* () {
        const programId = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
        const createPoolFeeAccount = '7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5'; // only mainnet, dev pls use 3XMrhbv989VxAMi3DErLV9eJht1pHppW5LbKxe9fkEFR
        const client = new yellowstone_grpc_1.default(config_1.rpcUrl, config_1.rpcToken);
        const rpcConnInfo = yield client.subscribe();
        rpcConnInfo.on("data", (data) => {
            callback(data, programId);
        });
        yield new Promise((resolve, reject) => {
            if (rpcConnInfo === undefined)
                throw Error('rpc conn error');
            rpcConnInfo.write({
                slots: {},
                accounts: {},
                transactions: {
                    transactionsSubKey: {
                        accountInclude: [createPoolFeeAccount],
                        accountExclude: [],
                        accountRequired: []
                    }
                },
                blocks: {},
                blocksMeta: {},
                accountsDataSlice: [],
                entry: {},
                commitment: 1
            }, (err) => {
                if (err === null || err === undefined) {
                    resolve();
                }
                else {
                    reject(err);
                }
            });
        }).catch((reason) => {
            console.error(reason);
            throw reason;
        });
    });
}
function callback(data, programId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!data.filters.includes('transactionsSubKey'))
            return undefined;
        const info = data.transaction;
        if (info.transaction.meta.err !== undefined)
            return undefined;
        const formatData = {
            slot: info.slot,
            txid: bs58_1.default.encode(info.transaction.signature),
            poolInfos: []
        };
        const accounts = info.transaction.transaction.message.accountKeys.map((i) => bs58_1.default.encode(i));
        for (const item of [...info.transaction.transaction.message.instructions, ...info.transaction.meta.innerInstructions.map((i) => i.instructions).flat()]) {
            if (accounts[item.programIdIndex] !== programId)
                continue;
            if ([...item.data.values()][0] != 1)
                continue;
            const keyIndex = [...item.accounts.values()];
            const [baseMintAccount, quoteMintAccount, marketAccount] = yield config_1.connection.getMultipleAccountsInfo([
                new web3_js_1.PublicKey(accounts[keyIndex[8]]),
                new web3_js_1.PublicKey(accounts[keyIndex[9]]),
                new web3_js_1.PublicKey(accounts[keyIndex[16]]),
            ]);
            if (baseMintAccount === null || quoteMintAccount === null || marketAccount === null)
                throw Error('get account info error');
            const baseMintInfo = raydium_sdk_1.SPL_MINT_LAYOUT.decode(baseMintAccount.data);
            const quoteMintInfo = raydium_sdk_1.SPL_MINT_LAYOUT.decode(quoteMintAccount.data);
            const marketInfo = raydium_sdk_1.MARKET_STATE_LAYOUT_V3.decode(marketAccount.data);
            formatData.poolInfos.push({
                id: accounts[keyIndex[4]],
                baseMint: accounts[keyIndex[8]],
                quoteMint: accounts[keyIndex[9]],
                lpMint: accounts[keyIndex[7]],
                baseDecimals: baseMintInfo.decimals,
                quoteDecimals: quoteMintInfo.decimals,
                lpDecimals: baseMintInfo.decimals,
                version: 4,
                programId: programId,
                authority: accounts[keyIndex[5]],
                openOrders: accounts[keyIndex[6]],
                targetOrders: accounts[keyIndex[12]],
                baseVault: accounts[keyIndex[10]],
                quoteVault: accounts[keyIndex[11]],
                withdrawQueue: web3_js_1.PublicKey.default.toString(),
                lpVault: web3_js_1.PublicKey.default.toString(),
                marketVersion: 3,
                marketProgramId: marketAccount.owner.toString(),
                marketId: accounts[keyIndex[16]],
                marketAuthority: raydium_sdk_1.Market.getAssociatedAuthority({ programId: marketAccount.owner, marketId: new web3_js_1.PublicKey(accounts[keyIndex[16]]) }).publicKey.toString(),
                marketBaseVault: marketInfo.baseVault.toString(),
                marketQuoteVault: marketInfo.quoteVault.toString(),
                marketBids: marketInfo.bids.toString(),
                marketAsks: marketInfo.asks.toString(),
                marketEventQueue: marketInfo.eventQueue.toString(),
                lookupTableAccount: web3_js_1.PublicKey.default.toString()
            });
        }
        console.log(formatData);
        return formatData;
    });
}
subNewAmmPool();
//# sourceMappingURL=subNewAmmPool.js.map