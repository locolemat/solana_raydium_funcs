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
const config_1 = require("../config");
const util_1 = require("./util");
function unstakeFarm(input) {
    return __awaiter(this, void 0, void 0, function* () {
        // -------- pre-action: fetch farm info --------
        const farmPool = yield (yield fetch(raydium_sdk_1.ENDPOINT + config_1.RAYDIUM_MAINNET_API.farmInfo)).json();
        (0, assert_1.default)(farmPool, 'farm pool is undefined');
        const targetFarmJsonInfo = farmPool.raydium.find((pool) => pool.id === input.targetFarm);
        (0, assert_1.default)(targetFarmJsonInfo, 'target farm not found');
        const targetFarmInfo = (0, raydium_sdk_1.jsonInfo2PoolKeys)(targetFarmJsonInfo);
        const chainTime = Math.floor(new Date().getTime() / 1000); // TODO
        // -------- step 1: Fetch farm pool info --------
        const { [input.targetFarm]: farmPoolInfo } = yield raydium_sdk_1.Farm.fetchMultipleInfoAndUpdate({
            connection: config_1.connection,
            pools: [targetFarmInfo],
            owner: input.wallet.publicKey,
            chainTime,
        });
        (0, assert_1.default)(farmPoolInfo, 'cannot fetch target farm info');
        // -------- step 2: create instructions by SDK function --------
        const makeWithdrawInstruction = yield raydium_sdk_1.Farm.makeWithdrawInstructionSimple({
            connection: config_1.connection,
            fetchPoolInfo: farmPoolInfo,
            ownerInfo: {
                feePayer: input.wallet.publicKey,
                wallet: input.wallet.publicKey,
                tokenAccounts: input.walletTokenAccounts,
            },
            amount: input.inputTokenAmount.raw,
            makeTxVersion: config_1.makeTxVersion,
        });
        return { txids: yield (0, util_1.buildAndSendTx)(makeWithdrawInstruction.innerTransactions) };
    });
}
function howToUse() {
    return __awaiter(this, void 0, void 0, function* () {
        const targetFarm = 'CHYrUBX2RKX8iBg7gYTkccoGNBzP44LdaazMHCLcdEgS'; // RAY-USDC farm
        const lpToken = config_1.DEFAULT_TOKEN['RAY_USDC-LP'];
        const inputTokenAmount = new raydium_sdk_1.TokenAmount(lpToken, 100);
        const walletTokenAccounts = yield (0, util_1.getWalletTokenAccount)(config_1.connection, config_1.wallet.publicKey);
        unstakeFarm({
            targetFarm,
            inputTokenAmount,
            walletTokenAccounts,
            wallet: config_1.wallet,
        }).then(({ txids }) => {
            /** continue with txids */
            console.log('txids', txids);
        });
    });
}
//# sourceMappingURL=unstakeFarm.js.map