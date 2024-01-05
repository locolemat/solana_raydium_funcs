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
const bn_js_1 = __importDefault(require("bn.js"));
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const config_1 = require("../config");
const formatClmmKeysById_1 = require("./formatClmmKeysById");
const util_1 = require("./util");
function clmmRemovePosition(input) {
    return __awaiter(this, void 0, void 0, function* () {
        // -------- pre-action: fetch basic info --------
        const clmmPool = yield (0, formatClmmKeysById_1.formatClmmKeysById)(input.targetPool);
        // -------- step 1: ammV3 info and ammV3 position --------
        const { [clmmPool.id]: sdkParsedAmmV3Info } = yield raydium_sdk_1.Clmm.fetchMultiplePoolInfos({
            connection: config_1.connection,
            poolKeys: [clmmPool],
            chainTime: new Date().getTime() / 1000,
            ownerInfo: {
                wallet: config_1.wallet.publicKey,
                tokenAccounts: input.walletTokenAccounts,
            },
        });
        const { state: clmmPoolInfo, positionAccount } = sdkParsedAmmV3Info;
        (0, assert_1.default)(positionAccount && positionAccount.length, "position is not exist/is empty, so can't continue to add position");
        const ammV3Position = positionAccount[0]; // assume first one is your target
        // -------- step 2: make ammV3 remove position instructions --------
        const makeDecreaseLiquidityInstruction = yield raydium_sdk_1.Clmm.makeDecreaseLiquidityInstructionSimple({
            connection: config_1.connection,
            poolInfo: clmmPoolInfo,
            ownerPosition: ammV3Position,
            ownerInfo: {
                feePayer: config_1.wallet.publicKey,
                wallet: config_1.wallet.publicKey,
                tokenAccounts: input.walletTokenAccounts,
                // closePosition: true, // for close
            },
            liquidity: ammV3Position.liquidity.div(new bn_js_1.default(2)), //for close position, use 'ammV3Position.liquidity' without dividend
            // slippage: 1, // if encouter slippage check error, try uncomment this line and set a number manually
            makeTxVersion: //for close position, use 'ammV3Position.liquidity' without dividend
            config_1.makeTxVersion,
            amountMinA: raydium_sdk_1.ZERO,
            amountMinB: raydium_sdk_1.ZERO
        });
        return { txids: yield (0, util_1.buildAndSendTx)(makeDecreaseLiquidityInstruction.innerTransactions) };
    });
}
function howToUse() {
    return __awaiter(this, void 0, void 0, function* () {
        const targetPool = '61R1ndXxvsWXXkWSyNkCxnzwd3zUNB8Q2ibmkiLPC8ht'; // USDC-RAY pool
        const walletTokenAccounts = yield (0, util_1.getWalletTokenAccount)(config_1.connection, config_1.wallet.publicKey);
        clmmRemovePosition({
            targetPool,
            walletTokenAccounts,
            wallet: config_1.wallet,
        }).then(({ txids }) => {
            /** continue with txids */
            console.log('txids', txids);
        });
    });
}
//# sourceMappingURL=clmmRemovePosition.js.map