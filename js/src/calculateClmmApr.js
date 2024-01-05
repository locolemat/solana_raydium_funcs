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
const decimal_js_1 = __importDefault(require("decimal.js"));
const config_1 = require("../config");
const formatClmmKeys_1 = require("./formatClmmKeys");
function calculateClmmApr() {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const poolId = '';
        const poolAccountInfo = yield config_1.connection.getAccountInfo(new web3_js_1.PublicKey(poolId));
        if (poolAccountInfo === null)
            throw Error('get pool account data error');
        const mintPrice = {};
        for (const [mint, price] of Object.entries(yield (yield fetch(config_1.ENDPOINT + config_1.RAYDIUM_MAINNET_API.price)).json()))
            mintPrice[mint] = price;
        const poolApiInfo = {};
        for (const item of yield (0, formatClmmKeys_1.formatClmmKeys)(config_1.PROGRAMIDS.CLMM.toString(), true))
            poolApiInfo[item.id] = item;
        const apiPoolInfo = poolApiInfo[poolId];
        if (apiPoolInfo === undefined)
            throw Error('api pool info check error');
        const poolInfo = raydium_sdk_1.PoolInfoLayout.decode(poolAccountInfo.data);
        const chainTime = yield config_1.connection.getBlockTime(yield config_1.connection.getSlot());
        if (chainTime === null)
            throw Error('get chain time error');
        const formatRewardInfo = [];
        for (const rewardInfo of poolInfo.rewardInfos) {
            if (rewardInfo.tokenMint.equals(web3_js_1.PublicKey.default))
                continue;
            const rewardVaultAdress = rewardInfo.tokenVault;
            const rewardVaultAccount = yield config_1.connection.getParsedAccountInfo(rewardVaultAdress);
            const rewardVaultAccountData = (_a = rewardVaultAccount.value) === null || _a === void 0 ? void 0 : _a.data;
            if (rewardVaultAccountData.program !== 'spl-token')
                continue;
            const rewardPerSecond = (rewardInfo.openTime.toNumber() < chainTime && rewardInfo.endTime.toNumber() > chainTime) ? raydium_sdk_1.MathUtil.x64ToDecimal(rewardInfo.emissionsPerSecondX64) : new decimal_js_1.default(0);
            const sendCountYear = new decimal_js_1.default(rewardPerSecond.mul(3600 * 24 * 365).toString()).div(Math.pow(10, rewardVaultAccountData.parsed.info.tokenAmount.decimals));
            const sendCountYearToU = sendCountYear.mul((_b = mintPrice[rewardVaultAccountData.parsed.info.mint]) !== null && _b !== void 0 ? _b : 0);
            const tvl = apiPoolInfo.tvl;
            formatRewardInfo.push({
                mint: rewardVaultAccountData.parsed.info.mint,
                price: (_c = mintPrice[rewardVaultAccountData.parsed.info.mint]) !== null && _c !== void 0 ? _c : 0,
                sendCountYear: sendCountYear.toNumber(),
                sendCountYearToU: sendCountYearToU.toNumber(),
                tvl,
                apr: tvl !== 0 ? sendCountYearToU.div(tvl).toNumber() : 0,
            });
        }
        console.log(formatRewardInfo);
    });
}
calculateClmmApr();
//# sourceMappingURL=calculateClmmApr.js.map