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
const config_1 = require("../config");
const formatClmmKeysById_1 = require("./formatClmmKeysById");
const util_1 = require("./util");
function clmmInitPoolReward(input) {
    return __awaiter(this, void 0, void 0, function* () {
        // -------- pre-action: fetch basic info --------
        const clmmPool = yield (0, formatClmmKeysById_1.formatClmmKeysById)(input.targetPool);
        // -------- step 1: Clmm info and Clmm position --------
        const { [clmmPool.id]: { state: poolInfo } } = yield raydium_sdk_1.Clmm.fetchMultiplePoolInfos({
            connection: config_1.connection,
            poolKeys: [clmmPool],
            chainTime: new Date().getTime() / 1000,
            ownerInfo: {
                wallet: input.wallet.publicKey,
                tokenAccounts: input.walletTokenAccounts,
            },
        });
        // prepare instruction
        const makeInitRewardsInstruction = yield raydium_sdk_1.Clmm.makeInitRewardsInstructionSimple({
            connection: config_1.connection,
            poolInfo,
            ownerInfo: {
                feePayer: input.wallet.publicKey,
                wallet: input.wallet.publicKey,
                tokenAccounts: input.walletTokenAccounts,
            },
            rewardInfos: input.rewardInfos.map((r) => (Object.assign(Object.assign({}, r), { mint: r.token.mint, programId: r.token.programId }))),
            makeTxVersion: config_1.makeTxVersion,
        });
        return { txids: yield (0, util_1.buildAndSendTx)(makeInitRewardsInstruction.innerTransactions) };
    });
}
function howToUse() {
    return __awaiter(this, void 0, void 0, function* () {
        const targetPool = '61R1ndXxvsWXXkWSyNkCxnzwd3zUNB8Q2ibmkiLPC8ht'; // USDC-RAY pool
        const walletTokenAccounts = yield (0, util_1.getWalletTokenAccount)(config_1.connection, config_1.wallet.publicKey);
        const rewardInfos = [
            {
                token: config_1.DEFAULT_TOKEN.RAY,
                openTime: 4073858467, // Wed Feb 04 2099 03:21:07 GMT+0000
                endTime: 4076277667, // Wed Mar 04 2099 03:21:07 GMT+0000
                perSecond: new decimal_js_1.default(0.000001),
            },
        ];
        clmmInitPoolReward({
            targetPool,
            walletTokenAccounts,
            wallet: config_1.wallet,
            rewardInfos,
        }).then(({ txids }) => {
            /** continue with txids */
            console.log('txids', txids);
        });
    });
}
//# sourceMappingURL=clmmInitPoolReward.js.map