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
const decimal_js_1 = __importDefault(require("decimal.js"));
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const bn_js_1 = __importDefault(require("bn.js"));
const config_1 = require("../config");
const formatClmmKeysById_1 = require("./formatClmmKeysById");
const getOutOfRangePositionOutAmount_1 = require("./getOutOfRangePositionOutAmount");
const util_1 = require("./util");
function clmmCreatePosition({ targetPool, inputTokenAmount, inputTokenMint, walletTokenAccounts, wallet, startPrice, endPrice, slippage }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (startPrice.gte(endPrice))
            throw Error('price input error');
        // -------- pre-action: fetch basic info --------
        const clmmPool = yield (0, formatClmmKeysById_1.formatClmmKeysById)(targetPool);
        // -------- step 1: Clmm info and Clmm position --------
        const { [clmmPool.id]: { state: poolInfo } } = yield raydium_sdk_1.Clmm.fetchMultiplePoolInfos({
            connection: config_1.connection,
            poolKeys: [clmmPool],
            chainTime: new Date().getTime() / 1000,
            ownerInfo: {
                wallet: wallet.publicKey,
                tokenAccounts: walletTokenAccounts,
            },
        });
        // -------- step 2: get tickUpper and tickLower --------
        const { tick: tickLower } = raydium_sdk_1.Clmm.getPriceAndTick({
            poolInfo,
            baseIn: true,
            price: startPrice,
        });
        const { tick: tickUpper } = raydium_sdk_1.Clmm.getPriceAndTick({
            poolInfo,
            baseIn: true,
            price: endPrice,
        });
        // -------- step 3: get liquidity --------
        const { liquidity, amountSlippageA, amountSlippageB } = raydium_sdk_1.Clmm.getLiquidityAmountOutFromAmountIn({
            poolInfo,
            slippage,
            inputA: inputTokenMint === 'mintA',
            tickUpper,
            tickLower,
            amount: new bn_js_1.default(inputTokenAmount.mul(Math.pow(10, poolInfo[inputTokenMint].decimals)).toFixed(0)),
            add: true,
            amountHasFee: true,
            token2022Infos: yield (0, raydium_sdk_1.fetchMultipleMintInfos)({ connection: config_1.connection, mints: [poolInfo.mintA.mint, poolInfo.mintB.mint] }),
            epochInfo: yield config_1.connection.getEpochInfo(),
        });
        console.log(`will add liquidity -> ${liquidity.toString()} - amount A -> ${(0, getOutOfRangePositionOutAmount_1._d)(poolInfo, amountSlippageA.amount, 'A')} - amount B -> ${(0, getOutOfRangePositionOutAmount_1._d)(poolInfo, amountSlippageB.amount, 'B')}`);
        // -------- step 4: make open position instruction --------
        const makeOpenPositionInstruction = yield raydium_sdk_1.Clmm.makeOpenPositionFromLiquidityInstructionSimple({
            connection: config_1.connection,
            poolInfo,
            ownerInfo: {
                feePayer: wallet.publicKey,
                wallet: wallet.publicKey,
                tokenAccounts: walletTokenAccounts,
            },
            tickLower,
            tickUpper,
            liquidity,
            makeTxVersion: config_1.makeTxVersion,
            amountMaxA: amountSlippageA.amount,
            amountMaxB: amountSlippageB.amount,
        });
        console.log('create position mint -> ', makeOpenPositionInstruction.address.nftMint.toString());
        return { txids: yield (0, util_1.buildAndSendTx)(makeOpenPositionInstruction.innerTransactions) };
    });
}
function howToUse() {
    return __awaiter(this, void 0, void 0, function* () {
        const targetPool = '61R1ndXxvsWXXkWSyNkCxnzwd3zUNB8Q2ibmkiLPC8ht'; // RAY-USDC pool
        const inputTokenAmount = new decimal_js_1.default(1);
        const inputTokenMint = 'mintA';
        const walletTokenAccounts = yield (0, util_1.getWalletTokenAccount)(config_1.connection, config_1.wallet.publicKey);
        const startPrice = new decimal_js_1.default(0.1);
        const endPrice = new decimal_js_1.default(1);
        const slippage = 0.01;
        clmmCreatePosition({
            targetPool,
            inputTokenAmount,
            inputTokenMint,
            walletTokenAccounts,
            wallet: config_1.wallet,
            startPrice,
            endPrice,
            slippage,
        }).then(({ txids }) => {
            /** continue with txids */
            console.log('txids', txids);
        });
    });
}
howToUse();
//# sourceMappingURL=clmmCreatePosition.js.map