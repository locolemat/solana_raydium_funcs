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
const bn_js_1 = require("bn.js");
const decimal_js_1 = __importDefault(require("decimal.js"));
const config_1 = require("../config");
function calculateFarmApr() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    return __awaiter(this, void 0, void 0, function* () {
        const poolId = '';
        const poolAccountInfo = yield config_1.connection.getAccountInfo(new web3_js_1.PublicKey(poolId));
        if (poolAccountInfo === null)
            throw Error('get pool account data error');
        const mintPrice = {};
        for (const [mint, price] of Object.entries(yield (yield fetch(config_1.ENDPOINT + config_1.RAYDIUM_MAINNET_API.price)).json()))
            mintPrice[mint] = price;
        const poolTvl = {};
        for (const info of (yield (yield fetch(config_1.ENDPOINT + config_1.RAYDIUM_MAINNET_API.farmApr)).json()).data)
            poolTvl[info.id] = info.tvl;
        const rewardInfo = [];
        switch (poolAccountInfo.owner.toString()) {
            case config_1.PROGRAMIDS.FarmV3.toString():
            case config_1.PROGRAMIDS.FarmV5.toString(): {
                const layout = config_1.PROGRAMIDS.FarmV3.toString() === poolAccountInfo.owner.toString() ? raydium_sdk_1.FARM_STATE_LAYOUT_V3 : raydium_sdk_1.FARM_STATE_LAYOUT_V5;
                const poolInfo = layout.decode(poolAccountInfo.data);
                const poolVaultAccount = yield config_1.connection.getParsedAccountInfo(poolInfo.lpVault);
                const poolVaultAccountData = (_a = poolVaultAccount.value) === null || _a === void 0 ? void 0 : _a.data;
                if (poolVaultAccountData.program !== 'spl-token')
                    break;
                for (const itemRewardInfo of poolInfo.rewardInfos) {
                    const rewardVaultAdress = itemRewardInfo.rewardVault;
                    const rewardVaultAccount = yield config_1.connection.getParsedAccountInfo(rewardVaultAdress);
                    const rewardVaultAccountData = (_b = rewardVaultAccount.value) === null || _b === void 0 ? void 0 : _b.data;
                    if (rewardVaultAccountData.program !== 'spl-token')
                        continue;
                    const sendCountYear = new decimal_js_1.default(itemRewardInfo.perSlotReward.mul(new bn_js_1.BN(2.5 * 3600 * 24 * 365)).toString()).div(Math.pow(10, rewardVaultAccountData.parsed.info.tokenAmount.decimals)); // one slot -> 400ms
                    const sendCountYearToU = sendCountYear.mul((_c = mintPrice[rewardVaultAccountData.parsed.info.mint]) !== null && _c !== void 0 ? _c : 0);
                    const tvl = poolTvl[poolId] !== undefined ? poolTvl[poolId] : poolVaultAccountData.parsed.info.tokenAmount.uiAmount * ((_d = mintPrice[poolVaultAccountData.parsed.info.mint]) !== null && _d !== void 0 ? _d : 0);
                    rewardInfo.push({
                        mint: rewardVaultAccountData.parsed.info.mint,
                        price: (_e = mintPrice[rewardVaultAccountData.parsed.info.mint]) !== null && _e !== void 0 ? _e : 0,
                        sendCountYear: sendCountYear.toNumber(),
                        sendCountYearToU: sendCountYearToU.toNumber(),
                        tvl,
                        apr: tvl !== 0 ? sendCountYearToU.div(tvl).toNumber() : 0,
                    });
                }
                break;
            }
            case config_1.PROGRAMIDS.FarmV6.toString(): {
                const layout = raydium_sdk_1.FARM_STATE_LAYOUT_V6;
                const poolInfo = layout.decode(poolAccountInfo.data);
                const chainTime = yield config_1.connection.getBlockTime(yield config_1.connection.getSlot());
                if (chainTime === null)
                    throw Error('get chain time error');
                const poolVaultAccount = yield config_1.connection.getParsedAccountInfo(poolInfo.lpVault);
                const poolVaultAccountData = (_f = poolVaultAccount.value) === null || _f === void 0 ? void 0 : _f.data;
                if (poolVaultAccountData.program !== 'spl-token')
                    break;
                for (const itemRewardInfo of poolInfo.rewardInfos) {
                    const rewardVaultAdress = itemRewardInfo.rewardVault;
                    const rewardVaultAccount = yield config_1.connection.getParsedAccountInfo(rewardVaultAdress);
                    const rewardVaultAccountData = (_g = rewardVaultAccount.value) === null || _g === void 0 ? void 0 : _g.data;
                    if (rewardVaultAccountData.program !== 'spl-token')
                        continue;
                    const rewardPerSecond = (itemRewardInfo.rewardOpenTime.toNumber() < chainTime && itemRewardInfo.rewardEndTime.toNumber() > chainTime) ? itemRewardInfo.rewardPerSecond : new bn_js_1.BN(0);
                    const sendCountYear = new decimal_js_1.default(rewardPerSecond.mul(new bn_js_1.BN(3600 * 24 * 365)).toString()).div(Math.pow(10, rewardVaultAccountData.parsed.info.tokenAmount.decimals));
                    const sendCountYearToU = sendCountYear.mul((_h = mintPrice[rewardVaultAccountData.parsed.info.mint]) !== null && _h !== void 0 ? _h : 0);
                    const tvl = poolTvl[poolId] !== undefined ? poolTvl[poolId] : poolVaultAccountData.parsed.info.tokenAmount.uiAmount * ((_j = mintPrice[poolVaultAccountData.parsed.info.mint]) !== null && _j !== void 0 ? _j : 0);
                    rewardInfo.push({
                        mint: rewardVaultAccountData.parsed.info.mint,
                        price: (_k = mintPrice[rewardVaultAccountData.parsed.info.mint]) !== null && _k !== void 0 ? _k : 0,
                        sendCountYear: sendCountYear.toNumber(),
                        sendCountYearToU: sendCountYearToU.toNumber(),
                        tvl,
                        apr: tvl !== 0 ? sendCountYearToU.div(tvl).toNumber() : 0,
                    });
                }
                break;
            }
            default:
                throw Error('program Id check error');
        }
        console.log(rewardInfo);
    });
}
//# sourceMappingURL=calculateFarmApr.js.map