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
const config_1 = require("../config");
const formatAmmKeysById_1 = require("./formatAmmKeysById");
const util_1 = require("./util");
function ammRemoveLiquidity(input) {
    return __awaiter(this, void 0, void 0, function* () {
        // -------- pre-action: fetch basic info --------
        const targetPoolInfo = yield (0, formatAmmKeysById_1.formatAmmKeysById)(input.targetPool);
        (0, assert_1.default)(targetPoolInfo, 'cannot find the target pool');
        // -------- step 1: make instructions --------
        const poolKeys = (0, raydium_sdk_1.jsonInfo2PoolKeys)(targetPoolInfo);
        const removeLiquidityInstructionResponse = yield raydium_sdk_1.Liquidity.makeRemoveLiquidityInstructionSimple({
            connection: config_1.connection,
            poolKeys,
            userKeys: {
                owner: input.wallet.publicKey,
                payer: input.wallet.publicKey,
                tokenAccounts: input.walletTokenAccounts,
            },
            amountIn: input.removeLpTokenAmount,
            makeTxVersion: config_1.makeTxVersion,
        });
        return { txids: yield (0, util_1.buildAndSendTx)(removeLiquidityInstructionResponse.innerTransactions) };
    });
}
function howToUse() {
    return __awaiter(this, void 0, void 0, function* () {
        const lpToken = new raydium_sdk_1.Token(raydium_sdk_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey(process.argv[2]), Number(process.argv[3]), process.argv[4], process.argv[4]); // LP
        const removeLpTokenAmount = new raydium_sdk_1.TokenAmount(lpToken, Number(process.argv[5]));
        const targetPool = process.argv[6]; // RAY-USDC pool
        const walletTokenAccounts = yield (0, util_1.getWalletTokenAccount)(config_1.connection, config_1.wallet.publicKey);
        ammRemoveLiquidity({
            removeLpTokenAmount,
            targetPool,
            walletTokenAccounts,
            wallet: config_1.wallet,
        }).then(({ txids }) => {
            /** continue with txids */
            console.log('txids', txids);
        })
            .catch((error) => {
            console.error('ERROR:', error);
        });
    });
}
//# sourceMappingURL=ammRemoveLiquidity.js.map