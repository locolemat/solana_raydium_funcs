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
function createFarm(input) {
    return __awaiter(this, void 0, void 0, function* () {
        // -------- pre-action: fetch basic info --------
        const targetPoolInfo = yield (0, formatAmmKeysById_1.formatAmmKeysById)(input.targetPool);
        (0, assert_1.default)(targetPoolInfo, 'cannot find the target pool');
        // -------- step 1: create instructions by SDK function --------
        const makeCreateFarmInstruction = yield raydium_sdk_1.Farm.makeCreateFarmInstructionSimple({
            connection: config_1.connection,
            userKeys: {
                tokenAccounts: input.walletTokenAccounts,
                owner: input.wallet.publicKey,
            },
            poolInfo: {
                version: 6,
                programId: raydium_sdk_1.MAINNET_PROGRAM_ID.FarmV6,
                lpMint: new web3_js_1.PublicKey(targetPoolInfo.lpMint),
                rewardInfos: input.rewardInfos.map((r) => {
                    var _a;
                    return ({
                        rewardMint: r.token.mint,
                        rewardOpenTime: r.openTime,
                        rewardEndTime: r.endTime,
                        rewardPerSecond: r.perSecond,
                        rewardType: (_a = r.type) !== null && _a !== void 0 ? _a : 'Standard SPL',
                    });
                }),
                lockInfo: input.lockInfo,
            },
            makeTxVersion: config_1.makeTxVersion,
        });
        return { txids: yield (0, util_1.buildAndSendTx)(makeCreateFarmInstruction.innerTransactions) };
    });
}
function howToUse() {
    return __awaiter(this, void 0, void 0, function* () {
        const targetPool = '61R1ndXxvsWXXkWSyNkCxnzwd3zUNB8Q2ibmkiLPC8ht'; // USDC-RAY pool
        const walletTokenAccounts = yield (0, util_1.getWalletTokenAccount)(config_1.connection, config_1.wallet.publicKey);
        const rewardInfos = [
            {
                token: config_1.DEFAULT_TOKEN.RAY,
                perSecond: 1,
                openTime: 4073858467, // Wed Feb 04 2099 03:21:07 GMT+0000
                endTime: 4076277667, // Wed Mar 04 2099 03:21:07 GMT+0000
            },
        ];
        const lockInfo = {
            lockMint: new web3_js_1.PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'),
            lockVault: new web3_js_1.PublicKey('FrspKwj8i3pNmKwXreTveC4fu7KL5ZbGeXdZBe2XViu1'),
        };
        createFarm({
            targetPool,
            walletTokenAccounts,
            wallet: config_1.wallet,
            rewardInfos,
            lockInfo,
        }).then(({ txids }) => {
            /** continue with txids */
            console.log('txids', txids);
        });
    });
}
//# sourceMappingURL=createFarm.js.map