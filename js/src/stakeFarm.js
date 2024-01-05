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
function stakeFarm(input) {
    return __awaiter(this, void 0, void 0, function* () {
        // -------- pre-action: fetch target farm json info --------
        const farmPools = yield (yield fetch(config_1.ENDPOINT + config_1.RAYDIUM_MAINNET_API.farmInfo)).json();
        (0, assert_1.default)(farmPools, 'farm pool is undefined');
        const targetFarmJsonInfo = farmPools.raydium.find((pool) => pool.id === input.targetFarm);
        (0, assert_1.default)(targetFarmJsonInfo, 'target farm not found');
        const targetFarmInfo = (0, raydium_sdk_1.jsonInfo2PoolKeys)(targetFarmJsonInfo);
        const chainTime = Math.floor(new Date().getTime() / 1000); // TODO
        const { [input.targetFarm]: farmFetchInfo } = yield raydium_sdk_1.Farm.fetchMultipleInfoAndUpdate({
            connection: config_1.connection,
            pools: [targetFarmInfo],
            chainTime,
        });
        (0, assert_1.default)(Object.keys(farmFetchInfo).length && farmFetchInfo, 'cannot fetch target farm info');
        // -------- step 1: create instructions by SDK function --------
        const makeDepositInstruction = yield raydium_sdk_1.Farm.makeDepositInstructionSimple({
            connection: config_1.connection,
            poolKeys: targetFarmInfo,
            fetchPoolInfo: farmFetchInfo,
            ownerInfo: {
                feePayer: input.wallet.publicKey,
                wallet: input.wallet.publicKey,
                tokenAccounts: input.walletTokenAccounts,
            },
            amount: input.inputTokenAmount.raw,
            makeTxVersion: config_1.makeTxVersion,
        });
        return { txids: yield (0, util_1.buildAndSendTx)(makeDepositInstruction.innerTransactions) };
    });
}
function howToUse() {
    return __awaiter(this, void 0, void 0, function* () {
        const targetFarm = 'CHYrUBX2RKX8iBg7gYTkccoGNBzP44LdaazMHCLcdEgS'; // RAY-USDC farm
        const lpToken = config_1.DEFAULT_TOKEN['RAY_USDC-LP'];
        const inputTokenAmount = new raydium_sdk_1.TokenAmount(lpToken, 100);
        const walletTokenAccounts = yield (0, util_1.getWalletTokenAccount)(config_1.connection, config_1.wallet.publicKey);
        stakeFarm({
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
//# sourceMappingURL=stakeFarm.js.map