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
exports.autoAddPositionFunc = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const decimal_js_1 = __importDefault(require("decimal.js"));
const config_1 = require("../config");
const formatAmmKeys_1 = require("./formatAmmKeys");
const formatClmmKeys_1 = require("./formatClmmKeys");
const util_1 = require("./util");
function autoAddPosition() {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        const positionMint = ''; // pls input mint
        const walletTokenAccounts = yield (0, util_1.getWalletTokenAccount)(config_1.connection, config_1.wallet.publicKey);
        const positionAccount = walletTokenAccounts.find(i => i.accountInfo.mint.toString() === positionMint && i.accountInfo.amount.toNumber() === 1);
        if (positionAccount === undefined) {
            throw Error('find positon from wallet error');
        }
        const positionAccountAddress = (0, raydium_sdk_1.getPdaPersonalPositionAddress)(config_1.PROGRAMIDS.CLMM, new web3_js_1.PublicKey(positionMint)).publicKey;
        const positionAccountInfo = yield config_1.connection.getAccountInfo(positionAccountAddress);
        if (positionAccountInfo === null)
            throw Error('get positionAccountInfo error');
        const positionAccountData = raydium_sdk_1.PositionInfoLayout.decode(positionAccountInfo.data);
        const positionPooId = positionAccountData.poolId;
        console.log('position pool id -> ', positionPooId.toString());
        const clmmPools = yield (0, formatClmmKeys_1.formatClmmKeys)(config_1.PROGRAMIDS.CLMM.toString(), true);
        const clmmPool = clmmPools.find(i => i.id === positionPooId.toString());
        if (clmmPool === undefined)
            throw Error('not found pool info from api');
        const clmmPoolInfo = yield raydium_sdk_1.Clmm.fetchMultiplePoolInfos({
            connection: config_1.connection,
            poolKeys: [clmmPool],
            chainTime: new Date().getTime() / 1000,
            ownerInfo: {
                wallet: config_1.wallet.publicKey,
                tokenAccounts: [positionAccount],
            },
            batchRequest: true,
            updateOwnerRewardAndFee: true,
        });
        const clmmInfo = clmmPoolInfo[positionPooId.toString()].state;
        const ownerPositionInfo = clmmPoolInfo[positionPooId.toString()].positionAccount[0];
        const ownerMintAtaA = (0, util_1.getATAAddress)(clmmInfo.mintA.programId, config_1.wallet.publicKey, clmmInfo.mintA.mint).publicKey;
        const ownerMintAtaB = (0, util_1.getATAAddress)(clmmInfo.mintB.programId, config_1.wallet.publicKey, clmmInfo.mintB.mint).publicKey;
        const ownerAccountA = (_b = (_a = walletTokenAccounts.find(i => i.pubkey.equals(ownerMintAtaA))) === null || _a === void 0 ? void 0 : _a.accountInfo.amount) !== null && _b !== void 0 ? _b : raydium_sdk_1.ZERO;
        const ownerAccountB = (_d = (_c = walletTokenAccounts.find(i => i.pubkey.equals(ownerMintAtaB))) === null || _c === void 0 ? void 0 : _c.accountInfo.amount) !== null && _d !== void 0 ? _d : raydium_sdk_1.ZERO;
        const clmmList = Object.values(yield raydium_sdk_1.Clmm.fetchMultiplePoolInfos({ connection: config_1.connection, poolKeys: clmmPools, chainTime: new Date().getTime() / 1000 })).map((i) => i.state);
        const sPool = yield (0, formatAmmKeys_1.formatAmmKeysToApi)(config_1.PROGRAMIDS.AmmV4.toString(), true);
        yield autoAddPositionFunc({
            poolInfo: clmmInfo,
            positionInfo: ownerPositionInfo,
            addMintAmountA: ownerAccountA,
            addMintAmountB: ownerAccountB,
            walletTokenAccounts,
            clmmList,
            sPool,
            clmmPools,
        });
    });
}
function autoAddPositionFunc({ poolInfo, positionInfo, addMintAmountA, addMintAmountB, walletTokenAccounts, clmmList, sPool, clmmPools }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (addMintAmountA.isZero() && addMintAmountB.isZero())
            new Error('input amount is zero');
        console.log('will add amount -> ', addMintAmountA.toString(), addMintAmountB.toString());
        const priceLower = raydium_sdk_1.Clmm.getTickPrice({
            poolInfo,
            tick: positionInfo.tickLower,
            baseIn: true,
        });
        const priceUpper = raydium_sdk_1.Clmm.getTickPrice({
            poolInfo,
            tick: positionInfo.tickUpper,
            baseIn: true,
        });
        const { amountA, amountB } = raydium_sdk_1.LiquidityMath.getAmountsFromLiquidity(poolInfo.sqrtPriceX64, priceLower.tickSqrtPriceX64, priceUpper.tickSqrtPriceX64, new bn_js_1.default(1000000000), false);
        let swapRatio = [];
        if (amountA.isZero() || amountB.isZero()) {
            swapRatio = [1];
        }
        else {
            swapRatio = Array.from({ length: Math.ceil(1 / 0.05) }, (_, i) => Math.floor((i + 1) * 0.05 * 100) / 100);
        }
        const willR = new decimal_js_1.default(amountA.toString()).div(amountB.toString());
        let swapType;
        if (amountB.isZero() && addMintAmountB.isZero()) {
            swapType = 'not need swap base A';
        }
        else if (amountB.isZero()) {
            swapType = 'B To A';
        }
        else if (addMintAmountB.isZero()) {
            swapType = 'A To B';
        }
        else {
            const amountR = new decimal_js_1.default(addMintAmountA.toString()).div(addMintAmountB.toString());
            if (willR.eq(amountR))
                swapType = 'not need swap base B'; // amount A = 0
            else
                swapType = willR.gt(amountR) ? 'B To A' : 'A To B';
        }
        console.log('will add pisition ratio', JSON.stringify({ amountA: String(amountA), amountB: String(amountB), ratio: willR }));
        const poolMintA = new raydium_sdk_1.Token(poolInfo.mintA.programId, poolInfo.mintA.mint, poolInfo.mintA.decimals);
        const poolMintB = new raydium_sdk_1.Token(poolInfo.mintB.programId, poolInfo.mintB.mint, poolInfo.mintB.decimals);
        let willRouteInfo = undefined;
        let willPositionInputAmount = raydium_sdk_1.ZERO;
        let willPositionOtherAmountMax = raydium_sdk_1.ZERO;
        let baseA = swapType === 'A To B' || swapType === 'not need swap base A';
        if (swapType === 'not need swap base A') {
            willPositionInputAmount = addMintAmountA;
            willPositionOtherAmountMax = addMintAmountB;
        }
        if (swapType === 'not need swap base B') {
            willPositionInputAmount = addMintAmountB;
            willPositionOtherAmountMax = addMintAmountA;
        }
        if (swapType === 'A To B') {
            const fromToken = poolMintA;
            const toToken = poolMintB;
            const fromAmount = addMintAmountA;
            const toAmount = addMintAmountB;
            const _willSwapAmount = fromAmount;
            const swapFromMintTokenAmount = new raydium_sdk_1.TokenAmount(fromToken, _willSwapAmount);
            const { getRoute, tickCache, poolInfosCache, } = yield swapStep1({
                swapFromMintTokenAmount,
                swapToMintToken: toToken,
                clmmList,
                sPool,
            });
            for (const itemRatio of swapRatio) {
                const willSwapAmount = new bn_js_1.default(new decimal_js_1.default(fromAmount.toString()).mul(itemRatio).toFixed(0));
                const swapFromMintTokenAmount = new raydium_sdk_1.TokenAmount(fromToken, willSwapAmount);
                const routeInfo = yield swapStep2({
                    getRoute, tickCache, poolInfosCache, swapFromMintTokenAmount,
                    swapToMintToken: toToken,
                    slippage: new raydium_sdk_1.Percent(1, 100),
                    clmmPools,
                });
                const outA = fromAmount.sub(willSwapAmount);
                const outB = toAmount.add(routeInfo.minAmountOut.amount.raw);
                if (!outB.isZero() && new decimal_js_1.default(outA.toString()).div(outB.toString()).lte(willR)) {
                    if (outA.isZero()) {
                        baseA = false;
                        willPositionInputAmount = outB;
                        willPositionOtherAmountMax = raydium_sdk_1.ZERO;
                    }
                    else {
                        willPositionInputAmount = outA;
                        willPositionOtherAmountMax = toAmount.add(routeInfo.amountOut.amount.raw);
                    }
                    willRouteInfo = routeInfo;
                    console.log('will swap A To B info ->', JSON.stringify({
                        fromToken: fromToken.mint.toString(),
                        toToken: toToken.mint.toString(),
                        fromAmount: willSwapAmount.toString(),
                        toAmountMin: routeInfo.minAmountOut.amount.raw.toString(),
                        swapRatio: itemRatio,
                    }));
                    break;
                }
            }
        }
        else if (swapType === 'B To A') {
            const fromToken = poolMintB;
            const toToken = poolMintA;
            const fromAmount = addMintAmountB;
            const toAmount = addMintAmountA;
            const _willSwapAmount = fromAmount;
            const swapFromMintTokenAmount = new raydium_sdk_1.TokenAmount(fromToken, _willSwapAmount);
            const { getRoute, tickCache, poolInfosCache, } = yield swapStep1({
                swapFromMintTokenAmount,
                swapToMintToken: toToken,
                clmmList,
                sPool,
            });
            for (const itemRatio of swapRatio) {
                const willSwapAmount = new bn_js_1.default(new decimal_js_1.default(fromAmount.toString()).mul(itemRatio).toFixed(0));
                const swapFromMintTokenAmount = new raydium_sdk_1.TokenAmount(fromToken, willSwapAmount);
                const routeInfo = yield swapStep2({
                    getRoute, tickCache, poolInfosCache, swapFromMintTokenAmount,
                    swapToMintToken: toToken,
                    slippage: new raydium_sdk_1.Percent(1, 100),
                    clmmPools,
                });
                const outB = fromAmount.sub(willSwapAmount);
                const outA = toAmount.add(routeInfo.minAmountOut.amount.raw);
                if (!outA.isZero() && new decimal_js_1.default(outB.toString()).div(outA.toString()).lte(new decimal_js_1.default(1).div(willR))) {
                    if (outB.isZero()) {
                        baseA = true;
                        willPositionInputAmount = outA;
                        willPositionOtherAmountMax = raydium_sdk_1.ZERO;
                    }
                    else {
                        willPositionInputAmount = outB;
                        willPositionOtherAmountMax = toAmount.add(routeInfo.amountOut.amount.raw);
                    }
                    willRouteInfo = routeInfo;
                    console.log('will swap B To A info ->', JSON.stringify({
                        fromToken: fromToken.mint.toString(),
                        toToken: toToken.mint.toString(),
                        fromAmount: willSwapAmount.toString(),
                        toAmountMin: routeInfo.minAmountOut.amount.raw.toString(),
                        swapRatio: itemRatio,
                    }));
                    break;
                }
            }
        }
        if (willRouteInfo !== undefined) {
            console.log('send Swap Instruction');
            const swapIns = yield swapStep3({
                wallet: config_1.wallet.publicKey,
                tokenAccounts: walletTokenAccounts,
                routeInfo: willRouteInfo,
            });
            console.log('swap txid -> ', yield (0, util_1.buildAndSendTx)(swapIns));
        }
        const ins = yield raydium_sdk_1.Clmm.makeIncreasePositionFromBaseInstructionSimple({
            makeTxVersion: config_1.makeTxVersion,
            connection: config_1.connection,
            poolInfo,
            ownerPosition: positionInfo,
            ownerInfo: {
                feePayer: config_1.wallet.publicKey,
                wallet: config_1.wallet.publicKey,
                tokenAccounts: walletTokenAccounts,
            },
            base: baseA ? 'MintA' : 'MintB',
            baseAmount: willPositionInputAmount,
            otherAmountMax: willPositionOtherAmountMax,
            associatedOnly: true,
        });
        yield (0, util_1.sleepTime)(3 * 1000);
        console.log('increase position txid -> ', yield (0, util_1.buildAndSendTx)(ins.innerTransactions, { skipPreflight: true }));
    });
}
exports.autoAddPositionFunc = autoAddPositionFunc;
function swapStep1({ swapFromMintTokenAmount, swapToMintToken, clmmList, sPool }) {
    return __awaiter(this, void 0, void 0, function* () {
        const getRoute = raydium_sdk_1.TradeV2.getAllRoute({
            inputMint: swapFromMintTokenAmount.token.mint,
            outputMint: swapToMintToken.mint,
            apiPoolList: sPool,
            clmmList,
        });
        const [tickCache, poolInfosCache] = yield Promise.all([
            yield raydium_sdk_1.Clmm.fetchMultiplePoolTickArrays({ connection: config_1.connection, poolKeys: getRoute.needTickArray, batchRequest: true }),
            yield raydium_sdk_1.TradeV2.fetchMultipleInfo({ connection: config_1.connection, pools: getRoute.needSimulate, batchRequest: true }),
        ]);
        return { getRoute, tickCache, poolInfosCache };
    });
}
function swapStep2({ getRoute, tickCache, poolInfosCache, swapFromMintTokenAmount, swapToMintToken, slippage, clmmPools }) {
    return __awaiter(this, void 0, void 0, function* () {
        const [routeInfo] = raydium_sdk_1.TradeV2.getAllRouteComputeAmountOut({
            directPath: getRoute.directPath,
            routePathDict: getRoute.routePathDict,
            simulateCache: poolInfosCache,
            tickCache,
            inputTokenAmount: swapFromMintTokenAmount,
            outputToken: swapToMintToken,
            slippage,
            chainTime: new Date().getTime() / 1000, // this chain time
            mintInfos: yield (0, raydium_sdk_1.fetchMultipleMintInfos)({
                connection: config_1.connection, mints: [
                    ...clmmPools.map(i => [{ mint: i.mintA, program: i.mintProgramIdA }, { mint: i.mintB, program: i.mintProgramIdB }]).flat().filter(i => i.program === spl_token_1.TOKEN_2022_PROGRAM_ID.toString()).map(i => new web3_js_1.PublicKey(i.mint)),
                ]
            }),
            epochInfo: yield config_1.connection.getEpochInfo(),
        });
        return routeInfo;
    });
}
function swapStep3({ routeInfo, wallet, tokenAccounts }) {
    return __awaiter(this, void 0, void 0, function* () {
        const { innerTransactions } = yield raydium_sdk_1.TradeV2.makeSwapInstructionSimple({
            routeProgram: config_1.PROGRAMIDS.Router,
            connection: config_1.connection,
            swapInfo: routeInfo,
            ownerInfo: {
                wallet,
                tokenAccounts,
                associatedOnly: true,
                checkCreateATAOwner: true,
            },
            makeTxVersion: config_1.makeTxVersion,
        });
        return innerTransactions;
    });
}
//# sourceMappingURL=autoAddPosition.js.map