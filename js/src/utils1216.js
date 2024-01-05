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
exports.utils1216 = void 0;
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const config_1 = require("../config");
const util_1 = require("./util");
function utils1216(input) {
    return __awaiter(this, void 0, void 0, function* () {
        // -------- pre-action: fetch compensation info list --------
        const infoList = yield raydium_sdk_1.Utils1216.getAllInfo({
            connection: config_1.connection,
            programId: config_1.PROGRAMIDS.UTIL1216,
            poolIds: raydium_sdk_1.Utils1216.DEFAULT_POOL_ID,
            wallet: input.wallet.publicKey,
            chainTime: new Date().getTime() / 1000,
        });
        // -------- step 1: create instructions by SDK function --------
        const claim = yield raydium_sdk_1.Utils1216.makeClaimInstructionSimple({
            connection: config_1.connection,
            poolInfo: infoList[0],
            ownerInfo: {
                wallet: input.wallet.publicKey,
                tokenAccounts: yield (0, util_1.getWalletTokenAccount)(config_1.connection, input.wallet.publicKey),
                associatedOnly: true,
                checkCreateATAOwner: true,
            },
            makeTxVersion: config_1.makeTxVersion,
        });
        // -------- step 1: create instructions by SDK function --------
        const claimAll = yield raydium_sdk_1.Utils1216.makeClaimAllInstructionSimple({
            connection: config_1.connection,
            poolInfos: infoList,
            ownerInfo: {
                wallet: input.wallet.publicKey,
                tokenAccounts: yield (0, util_1.getWalletTokenAccount)(config_1.connection, input.wallet.publicKey),
                associatedOnly: true,
                checkCreateATAOwner: true,
            },
            makeTxVersion: config_1.makeTxVersion,
        });
        return { txids: yield (0, util_1.buildAndSendTx)(claimAll.innerTransactions) };
    });
}
exports.utils1216 = utils1216;
function howToUse() {
    return __awaiter(this, void 0, void 0, function* () {
        utils1216({
            wallet: config_1.wallet,
        }).then(({ txids }) => {
            /** continue with txids */
            console.log('txids', txids);
        });
    });
}
//# sourceMappingURL=utils1216.js.map