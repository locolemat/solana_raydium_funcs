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
const bn_js_1 = __importDefault(require("bn.js"));
const decimal_js_1 = __importDefault(require("decimal.js"));
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../config");
function checkClmmPosition() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const poolId = new web3_js_1.PublicKey("poolId");
        const poolInfoAccount = yield config_1.connection.getAccountInfo(poolId);
        if (poolInfoAccount === null)
            throw Error(' pool id error ');
        const poolInfo = raydium_sdk_1.PoolInfoLayout.decode(poolInfoAccount.data);
        console.log("current activated liquidity:", poolInfo.liquidity.toString());
        const gPA = yield config_1.connection.getProgramAccounts(config_1.PROGRAMIDS.CLMM, {
            commitment: "confirmed",
            filters: [
                { dataSize: raydium_sdk_1.PositionInfoLayout.span },
                { memcmp: { bytes: poolId.toBase58(), offset: raydium_sdk_1.PositionInfoLayout.offsetOf('poolId') } },
            ]
        });
        const poolRewardMint = poolInfo.rewardInfos.map(i => i.tokenMint);
        const poolRewardMintAccount = yield config_1.connection.getMultipleAccountsInfo(poolRewardMint);
        const poolRewardMintDecimals = [];
        for (let i = 0; i < 3; i++) {
            const mint = poolRewardMint[i].toString();
            const account = poolRewardMintAccount[i];
            if (mint.toString() === web3_js_1.PublicKey.default.toString()) {
                poolRewardMintDecimals.push(0);
            }
            else if (account === null) {
                throw Error('get reward mint info error');
            }
            else {
                const _mint = spl_token_1.MintLayout.decode(account.data);
                poolRewardMintDecimals.push(_mint.decimals);
            }
        }
        console.log("num of positions:", gPA.length);
        let checkSumLiquidity = new bn_js_1.default(0);
        for (const account of gPA) {
            const position = raydium_sdk_1.PositionInfoLayout.decode(account.account.data);
            const owner = yield findNftOwner(position.nftMint);
            const status = checkPositionStatus(poolInfo, position);
            if (status === "InRange")
                checkSumLiquidity = checkSumLiquidity.add(position.liquidity);
            const amounts = raydium_sdk_1.LiquidityMath.getAmountsFromLiquidity(poolInfo.sqrtPriceX64, raydium_sdk_1.SqrtPriceMath.getSqrtPriceX64FromTick(position.tickLower), raydium_sdk_1.SqrtPriceMath.getSqrtPriceX64FromTick(position.tickUpper), position.liquidity, false);
            const amountA = new decimal_js_1.default(amounts.amountA.toString()).div(Math.pow(10, poolInfo.mintDecimalsA));
            const amountB = new decimal_js_1.default(amounts.amountB.toString()).div(Math.pow(10, poolInfo.mintDecimalsB));
            const tickArrayLowerAddress = raydium_sdk_1.TickUtils.getTickArrayAddressByTick(poolInfoAccount.owner, poolId, position.tickLower, poolInfo.tickSpacing);
            const tickArrayUpperAddress = raydium_sdk_1.TickUtils.getTickArrayAddressByTick(poolInfoAccount.owner, poolId, position.tickUpper, poolInfo.tickSpacing);
            const tickLowerState = (yield getAndCacheTick(config_1.connection, tickArrayLowerAddress)).ticks[raydium_sdk_1.TickUtils.getTickOffsetInArray(position.tickLower, poolInfo.tickSpacing)];
            const tickUpperState = (yield getAndCacheTick(config_1.connection, tickArrayUpperAddress)).ticks[raydium_sdk_1.TickUtils.getTickOffsetInArray(position.tickUpper, poolInfo.tickSpacing)];
            // @ts-ignore
            const { tokenFeeAmountA: _pendingFeeA, tokenFeeAmountB: _pendingFeeB } = raydium_sdk_1.PositionUtils.GetPositionFees({
                tickCurrent: poolInfo.tickCurrent,
                feeGrowthGlobalX64A: new bn_js_1.default(poolInfo.feeGrowthGlobalX64A),
                feeGrowthGlobalX64B: new bn_js_1.default(poolInfo.feeGrowthGlobalX64B),
            }, {
                feeGrowthInsideLastX64A: new bn_js_1.default(position.feeGrowthInsideLastX64A),
                feeGrowthInsideLastX64B: new bn_js_1.default(position.feeGrowthInsideLastX64B),
                tokenFeesOwedA: new bn_js_1.default(position.tokenFeesOwedA),
                tokenFeesOwedB: new bn_js_1.default(position.tokenFeesOwedB),
                liquidity: new bn_js_1.default(position.liquidity),
            }, tickLowerState, tickUpperState);
            const pendingFeeA = new decimal_js_1.default(_pendingFeeA.toString()).div(Math.pow(10, poolInfo.mintDecimalsA));
            const pendingFeeB = new decimal_js_1.default(_pendingFeeB.toString()).div(Math.pow(10, poolInfo.mintDecimalsB));
            const rewardInfos = raydium_sdk_1.PositionUtils.GetPositionRewards({
                tickCurrent: poolInfo.tickCurrent,
                // @ts-ignore
                rewardInfos: poolInfo.rewardInfos.map((i) => ({ rewardGrowthGlobalX64: new bn_js_1.default(i.rewardGrowthGlobalX64) }))
            }, {
                liquidity: new bn_js_1.default(position.liquidity),
                rewardInfos: position.rewardInfos.map((i) => ({ growthInsideLastX64: new bn_js_1.default(i.growthInsideLastX64), rewardAmountOwed: new bn_js_1.default(i.rewardAmountOwed) }))
            }, tickLowerState, tickUpperState);
            console.log("\taddress:", account.pubkey.toBase58(), "\towner:", (_a = owner === null || owner === void 0 ? void 0 : owner.toBase58()) !== null && _a !== void 0 ? _a : "NOTFOUND", "\tliquidity:", position.liquidity.toString(), "\tstatus:", status, "\tamountA:", amountA.toString(), "\tamountB:", amountB.toString(), "\tpendingFeeA:", pendingFeeA.toString(), "\tpendingFeeB:", pendingFeeB.toString(), "\trewardA:", new decimal_js_1.default(rewardInfos[0].toString()).div(Math.pow(10, poolRewardMintDecimals[0])).toString(), "\trewardB:", new decimal_js_1.default(rewardInfos[1].toString()).div(Math.pow(10, poolRewardMintDecimals[1])).toString(), "\trewardC:", new decimal_js_1.default(rewardInfos[2].toString()).div(Math.pow(10, poolRewardMintDecimals[2])).toString());
        }
        console.log("check sum:", checkSumLiquidity.eq(poolInfo.liquidity));
    });
}
function checkPositionStatus(poolInfo, position) {
    if (position.tickUpper <= poolInfo.tickCurrent)
        return "OutOfRange(PriceIsAboveRange)";
    if (position.tickLower > poolInfo.tickCurrent)
        return "OutOfRange(PriceIsBelowRange)";
    return "InRange";
}
function findNftOwner(mint) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield config_1.connection.getTokenLargestAccounts(mint);
        if (!res.value)
            return null;
        if (res.value.length === 0)
            return null;
        if (res.value[0].uiAmount !== 1)
            return null;
        const account = yield config_1.connection.getAccountInfo(res.value[0].address);
        const info = raydium_sdk_1.SPL_ACCOUNT_LAYOUT.decode(account === null || account === void 0 ? void 0 : account.data);
        return info.owner;
    });
}
const _tempCache = {};
function getAndCacheTick(connection, address) {
    return __awaiter(this, void 0, void 0, function* () {
        if (_tempCache[address.toString()] !== undefined)
            return _tempCache[address.toString()];
        const account = yield connection.getAccountInfo(address);
        if (account === null)
            throw Error(' get tick error ');
        const _d = raydium_sdk_1.TickArrayLayout.decode(account.data);
        _tempCache[address.toString()] = _d;
        return _d;
    });
}
checkClmmPosition();
//# sourceMappingURL=checkClmmPosition.js.map