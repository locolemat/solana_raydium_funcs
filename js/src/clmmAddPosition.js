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
const assert_1 = __importDefault(require("assert"));
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = require("bn.js");
const decimal_js_1 = __importDefault(require("decimal.js"));
const config_1 = require("../config");
const formatClmmKeysById_1 = require("./formatClmmKeysById");
const getOutOfRangePositionOutAmount_1 = require("./getOutOfRangePositionOutAmount");
const util_1 = require("./util");
function clmmAddPosition({ targetPool, inputTokenAmount, inputTokenMint, wallet, walletTokenAccounts, slippage, positionMint }) {
    return __awaiter(this, void 0, void 0, function* () {
        // -------- pre-action: fetch basic info --------
        const clmmPool = yield (0, formatClmmKeysById_1.formatClmmKeysById)(targetPool);
        // -------- step 1: Clmm info and Clmm position --------
        const { [clmmPool.id]: { state: poolInfo, positionAccount } } = yield raydium_sdk_1.Clmm.fetchMultiplePoolInfos({
            connection: config_1.connection,
            poolKeys: [clmmPool],
            chainTime: new Date().getTime() / 1000,
            ownerInfo: {
                wallet: wallet.publicKey,
                tokenAccounts: walletTokenAccounts,
            },
        });
        (0, assert_1.default)(positionAccount && positionAccount.length, "position is not exist/is empty, so can't continue to add position");
        const clmmPosition = positionAccount.find(i => i.nftMint.equals(positionMint)); // assume first one is your target
        if (clmmPosition === undefined)
            throw Error('not found position');
        // -------- step 2: calculate liquidity --------
        const { liquidity, amountSlippageA, amountSlippageB } = raydium_sdk_1.Clmm.getLiquidityAmountOutFromAmountIn({
            poolInfo,
            slippage: 0,
            inputA: inputTokenMint === 'mintA',
            tickUpper: clmmPosition.tickUpper,
            tickLower: clmmPosition.tickLower,
            amount: new bn_js_1.BN(inputTokenAmount.mul(Math.pow(10, poolInfo[inputTokenMint].decimals)).toFixed(0)),
            add: true, // SDK flag for math round direction
            amountHasFee: true,
            token2022Infos: yield (0, raydium_sdk_1.fetchMultipleMintInfos)({ connection: config_1.connection, mints: [poolInfo.mintA.mint, poolInfo.mintB.mint] }),
            epochInfo: yield config_1.connection.getEpochInfo()
        });
        console.log(`will add liquidity -> ${liquidity.toString()} - amount A -> ${(0, getOutOfRangePositionOutAmount_1._d)(poolInfo, amountSlippageA.amount, 'A')} - amount B -> ${(0, getOutOfRangePositionOutAmount_1._d)(poolInfo, amountSlippageB.amount, 'B')}`);
        // -------- step 3: create instructions by SDK function --------
        const makeIncreaseLiquidityInstruction = yield raydium_sdk_1.Clmm.makeIncreasePositionFromLiquidityInstructionSimple({
            connection: config_1.connection,
            poolInfo,
            ownerPosition: clmmPosition,
            ownerInfo: {
                feePayer: wallet.publicKey,
                wallet: wallet.publicKey,
                tokenAccounts: walletTokenAccounts,
            },
            liquidity,
            makeTxVersion: config_1.makeTxVersion,
            amountMaxA: amountSlippageA.amount,
            amountMaxB: amountSlippageB.amount,
        });
        return { txids: yield (0, util_1.buildAndSendTx)(makeIncreaseLiquidityInstruction.innerTransactions) };
    });
}
function howToUse() {
    return __awaiter(this, void 0, void 0, function* () {
        const targetPool = '61R1ndXxvsWXXkWSyNkCxnzwd3zUNB8Q2ibmkiLPC8ht'; // RAY-USDC pool
        const inputTokenAmount = new decimal_js_1.default(1);
        const inputTokenMint = 'mintA';
        const walletTokenAccounts = yield (0, util_1.getWalletTokenAccount)(config_1.connection, config_1.wallet.publicKey);
        const slippage = 0.01;
        const positionMint = new web3_js_1.PublicKey('');
        clmmAddPosition({
            targetPool,
            inputTokenAmount,
            inputTokenMint,
            walletTokenAccounts,
            wallet: config_1.wallet,
            slippage,
            positionMint,
        }).then(({ txids }) => {
            /** continue with txids */
            console.log('txids', txids);
        });
    });
}
//# sourceMappingURL=clmmAddPosition.js.map