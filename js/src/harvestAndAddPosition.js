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
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../config");
const autoAddPosition_1 = require("./autoAddPosition");
const formatAmmKeys_1 = require("./formatAmmKeys");
const formatClmmKeys_1 = require("./formatClmmKeys");
const util_1 = require("./util");
function harvestAndAddPosition() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    return __awaiter(this, void 0, void 0, function* () {
        const positionMint = '';
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
        const rewardInfos = [];
        for (let i = 0; i < Math.min(clmmInfo.rewardInfos.length, ownerPositionInfo.rewardInfos.length); i++)
            rewardInfos.push({ poolReward: clmmInfo.rewardInfos[i], ownerReward: ownerPositionInfo.rewardInfos[i] });
        console.log('ownerPositionInfo');
        console.log('amount -> ', Object.entries({ liquidity: ownerPositionInfo.liquidity, amountA: ownerPositionInfo.amountA, amountB: ownerPositionInfo.amountB }).map(i => `${i[0]} -- ${String(i[1])}`));
        console.log('fee -> ', Object.entries({ tokenFeeAmountA: ownerPositionInfo.tokenFeeAmountA, tokenFeeAmountB: ownerPositionInfo.tokenFeeAmountB }).map(i => `${i[0]} -- ${String(i[1])}`));
        console.log('reward -> ', rewardInfos.map(i => ({ mint: i.poolReward.tokenMint, pending: i.ownerReward.pendingReward })).map(ii => Object.entries(ii).map(i => `${i[0]} -- ${String(i[1])}`)));
        const tempCount = ownerPositionInfo.tokenFeeAmountA.add(ownerPositionInfo.tokenFeeAmountB).add(rewardInfos.map(i => i.ownerReward.pendingReward).reduce((a, b) => a.add(b), new bn_js_1.default(0)));
        if (tempCount.lte(raydium_sdk_1.ZERO))
            throw Error('No need to withdraw token');
        const needCacheMint = [
            { programId: clmmInfo.mintA.programId.toString(), mint: clmmInfo.mintA.mint.toString() },
            { programId: clmmInfo.mintB.programId.toString(), mint: clmmInfo.mintB.mint.toString() },
            ...clmmInfo.rewardInfos.map(i => ({ programId: i.tokenProgramId.toString(), mint: i.tokenMint.toString() })).filter(i => i.mint !== web3_js_1.PublicKey.default.toString())
        ];
        const mintAccount = {};
        for (const itemMint of needCacheMint) {
            const mintAllAccount = walletTokenAccounts.filter(i => i.accountInfo.mint.toString() === itemMint.mint);
            const mintAta = (0, util_1.getATAAddress)(new web3_js_1.PublicKey(itemMint.programId), config_1.wallet.publicKey, new web3_js_1.PublicKey(itemMint.mint)).publicKey;
            mintAccount[mintAta.toString()] = {
                mint: itemMint.mint,
                amount: (_b = (_a = mintAllAccount.find(i => i.pubkey.equals(mintAta))) === null || _a === void 0 ? void 0 : _a.accountInfo.amount) !== null && _b !== void 0 ? _b : raydium_sdk_1.ZERO,
            };
        }
        console.log('start amount cache', Object.entries(mintAccount).map(i => `account ->${i[0]} -- mint-> ${i[1].mint} -- amount -> ${String(i[1].amount)} `));
        // claim fee and reward
        const decreaseIns = yield raydium_sdk_1.Clmm.makeDecreaseLiquidityInstructionSimple({
            connection: config_1.connection,
            poolInfo: clmmInfo,
            ownerPosition: ownerPositionInfo,
            liquidity: raydium_sdk_1.ZERO,
            amountMinA: raydium_sdk_1.ZERO,
            amountMinB: raydium_sdk_1.ZERO,
            makeTxVersion: config_1.makeTxVersion,
            ownerInfo: {
                feePayer: config_1.wallet.publicKey,
                wallet: config_1.wallet.publicKey,
                tokenAccounts: walletTokenAccounts,
                useSOLBalance: false,
                closePosition: false,
            },
            associatedOnly: true,
        });
        console.log('claim fee and reward txid: ', yield (0, util_1.buildAndSendTx)(decreaseIns.innerTransactions));
        const _tempBaseMint = [
            'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
            'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
            'So11111111111111111111111111111111111111112', // WSOL
            '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY
        ];
        const swapToMintBase = _tempBaseMint.includes(clmmInfo.mintA.mint.toString()) ? 'A' : 'B';
        const _tempMintInfo = swapToMintBase === 'A' ? clmmInfo.mintA : clmmInfo.mintB;
        const swapToMintToken = new raydium_sdk_1.Token(_tempMintInfo.programId, _tempMintInfo.mint, _tempMintInfo.decimals, 'temp', 'temp');
        // swap start
        const sPool = yield (0, formatAmmKeys_1.formatAmmKeysToApi)(config_1.PROGRAMIDS.AmmV4.toString(), true);
        const clmmList = Object.values(yield raydium_sdk_1.Clmm.fetchMultiplePoolInfos({ connection: config_1.connection, poolKeys: clmmPools, chainTime: new Date().getTime() / 1000 })).map((i) => i.state);
        for (const itemReward of rewardInfos) {
            const rewardMintAccountInfo = yield config_1.connection.getAccountInfo(itemReward.poolReward.tokenMint);
            const rewardMintInfo = raydium_sdk_1.SPL_MINT_LAYOUT.decode(rewardMintAccountInfo.data);
            const swapFromMintToken = new raydium_sdk_1.Token(itemReward.poolReward.tokenProgramId, itemReward.poolReward.tokenMint, rewardMintInfo.decimals, '_temp', '_temp');
            const swapFromMintTokenAmount = new raydium_sdk_1.TokenAmount(swapFromMintToken, itemReward.ownerReward.pendingReward);
            const swapInfo = yield swap({
                wallet: config_1.wallet.publicKey,
                tokenAccounts: walletTokenAccounts,
                clmmList,
                clmmPools,
                swapFromMintTokenAmount,
                swapToMintToken,
                sPool,
                slippage: new raydium_sdk_1.Percent(1, 100),
            });
            console.log('will swap reward -> ', Object.entries({
                programId: itemReward.poolReward.tokenProgramId,
                mint: itemReward.poolReward.tokenMint,
                decimals: rewardMintInfo.decimals,
                amount: itemReward.ownerReward.pendingReward,
                swapToMint: _tempMintInfo.mint,
                swapToAmount: swapInfo.amountMin.amount.raw.sub((_d = (_c = swapInfo.amountMin.fee) === null || _c === void 0 ? void 0 : _c.raw) !== null && _d !== void 0 ? _d : raydium_sdk_1.ZERO),
            }).map(i => `${i[0]} -- ${String(i[1])}`));
            console.log('swap reward txid: ', yield (0, util_1.buildAndSendTx)(decreaseIns.innerTransactions));
        }
        if (rewardInfos.length > 0)
            yield (0, util_1.sleepTime)(30 * 1000); // await to confirm
        const walletTokenAccountsSwapRewardOver = yield (0, util_1.getWalletTokenAccount)(config_1.connection, config_1.wallet.publicKey);
        const mintAccountSwapRewardOver = {};
        for (const itemMint of needCacheMint) {
            const mintAllAccount = walletTokenAccountsSwapRewardOver.filter(i => i.accountInfo.mint.toString() === itemMint.mint);
            const mintAta = (0, util_1.getATAAddress)(new web3_js_1.PublicKey(itemMint.programId), config_1.wallet.publicKey, new web3_js_1.PublicKey(itemMint.mint)).publicKey;
            mintAccountSwapRewardOver[mintAta.toString()] = {
                mint: itemMint.mint,
                amount: (_f = (_e = mintAllAccount.find(i => i.pubkey.equals(mintAta))) === null || _e === void 0 ? void 0 : _e.accountInfo.amount) !== null && _f !== void 0 ? _f : raydium_sdk_1.ZERO,
            };
        }
        console.log('swap reward over amount cache', Object.entries(mintAccountSwapRewardOver).map(i => `account ->${i[0]} -- mint-> ${i[1].mint} -- amount -> ${String(i[1].amount)} `));
        const mintAtaA = (0, util_1.getATAAddress)(new web3_js_1.PublicKey(clmmInfo.mintA.programId), config_1.wallet.publicKey, new web3_js_1.PublicKey(clmmInfo.mintA.mint)).publicKey.toString();
        const mintAtaB = (0, util_1.getATAAddress)(new web3_js_1.PublicKey(clmmInfo.mintB.programId), config_1.wallet.publicKey, new web3_js_1.PublicKey(clmmInfo.mintB.mint)).publicKey.toString();
        const willAddMintAmountA = ((_g = mintAccountSwapRewardOver[mintAtaA].amount) !== null && _g !== void 0 ? _g : raydium_sdk_1.ZERO).sub((_h = mintAccount[mintAtaA].amount) !== null && _h !== void 0 ? _h : raydium_sdk_1.ZERO);
        const willAddMintAmountB = ((_j = mintAccountSwapRewardOver[mintAtaB].amount) !== null && _j !== void 0 ? _j : raydium_sdk_1.ZERO).sub((_k = mintAccount[mintAtaB].amount) !== null && _k !== void 0 ? _k : raydium_sdk_1.ZERO);
        yield (0, autoAddPosition_1.autoAddPositionFunc)({
            poolInfo: clmmInfo,
            positionInfo: ownerPositionInfo,
            addMintAmountA: willAddMintAmountA,
            addMintAmountB: willAddMintAmountB,
            walletTokenAccounts,
            clmmList,
            sPool,
            clmmPools,
        });
    });
}
function swap({ wallet, tokenAccounts, clmmPools, swapFromMintTokenAmount, swapToMintToken, clmmList, sPool, slippage }) {
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
        return {
            ins: innerTransactions,
            amountMin: routeInfo.minAmountOut,
        };
    });
}
//# sourceMappingURL=harvestAndAddPosition.js.map