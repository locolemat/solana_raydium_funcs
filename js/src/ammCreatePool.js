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
const bn_js_1 = require("bn.js");
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../config");
const util_1 = require("./util");
const ZERO = new bn_js_1.BN(0);
function calcMarketStartPrice(input) {
    return input.addBaseAmount.toNumber() / Math.pow(10, 6) / (input.addQuoteAmount.toNumber() / Math.pow(10, 6));
}
function getMarketAssociatedPoolKeys(input) {
    return raydium_sdk_1.Liquidity.getAssociatedPoolKeys({
        version: 4,
        marketVersion: 3,
        baseMint: input.baseToken.mint,
        quoteMint: input.quoteToken.mint,
        baseDecimals: input.baseToken.decimals,
        quoteDecimals: input.quoteToken.decimals,
        marketId: input.targetMargetId,
        programId: config_1.PROGRAMIDS.AmmV4,
        marketProgramId: raydium_sdk_1.MAINNET_PROGRAM_ID.OPENBOOK_MARKET,
    });
}
function ammCreatePool(input) {
    return __awaiter(this, void 0, void 0, function* () {
        // -------- step 1: make instructions --------
        const initPoolInstructionResponse = yield raydium_sdk_1.Liquidity.makeCreatePoolV4InstructionV2Simple({
            connection: config_1.connection,
            programId: config_1.PROGRAMIDS.AmmV4,
            marketInfo: {
                marketId: input.targetMargetId,
                programId: config_1.PROGRAMIDS.OPENBOOK_MARKET,
            },
            baseMintInfo: input.baseToken,
            quoteMintInfo: input.quoteToken,
            baseAmount: input.addBaseAmount,
            quoteAmount: input.addQuoteAmount,
            startTime: new bn_js_1.BN(Math.floor(input.startTime)),
            ownerInfo: {
                feePayer: input.wallet.publicKey,
                wallet: input.wallet.publicKey,
                tokenAccounts: input.walletTokenAccounts,
                useSOLBalance: true,
            },
            associatedOnly: false,
            checkCreateATAOwner: true,
            makeTxVersion: config_1.makeTxVersion,
            feeDestinationId: new web3_js_1.PublicKey('7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5'), // only mainnet use this
        });
        return { txids: yield (0, util_1.buildAndSendTx)(initPoolInstructionResponse.innerTransactions) };
    });
}
function howToUse() {
    return __awaiter(this, void 0, void 0, function* () {
        const baseToken = new raydium_sdk_1.Token(raydium_sdk_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey(process.argv[2]), Number(process.argv[3]), process.argv[4], process.argv[4]); // USDC
        const quoteToken = new raydium_sdk_1.Token(raydium_sdk_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey(process.argv[5]), Number(process.argv[6]), process.argv[7], process.argv[7]); // RAY
        const targetMargetId = new web3_js_1.PublicKey(process.argv[8]);
        const addBaseAmount = new bn_js_1.BN(Number(process.argv[9])); // 10000 / 10 ** 6,
        const addQuoteAmount = new bn_js_1.BN(Number(process.argv[10])); // 10000 / 10 ** 6,
        const startTime = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // start from 7 days later
        const walletTokenAccounts = yield (0, util_1.getWalletTokenAccount)(config_1.connection, config_1.wallet.publicKey);
        /* do something with start price if needed */
        const startPrice = calcMarketStartPrice({ addBaseAmount, addQuoteAmount });
        /* do something with market associated pool keys if needed */
        const associatedPoolKeys = getMarketAssociatedPoolKeys({
            baseToken,
            quoteToken,
            targetMargetId,
        });
        ammCreatePool({
            startTime,
            addBaseAmount,
            addQuoteAmount,
            baseToken,
            quoteToken,
            targetMargetId,
            wallet: config_1.wallet,
            walletTokenAccounts,
        }).then(({ txids }) => {
            /** continue with txids */
            console.log('txids', txids);
        })
            .catch((error) => {
            console.error('ERROR:', error);
        });
    });
}
howToUse();
//# sourceMappingURL=ammCreatePool.js.map