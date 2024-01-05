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
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const config_1 = require("../config");
const formatClmmKeys_1 = require("./formatClmmKeys");
const util_1 = require("./util");
function clmmOwnerPositionInfo(input) {
    return __awaiter(this, void 0, void 0, function* () {
        const poolKeys = yield (0, formatClmmKeys_1.formatClmmKeys)(config_1.PROGRAMIDS.CLMM.toString());
        const infos = yield raydium_sdk_1.Clmm.fetchMultiplePoolInfos({
            connection: config_1.connection,
            poolKeys,
            chainTime: new Date().getTime() / 1000,
            ownerInfo: {
                wallet: input.wallet.publicKey,
                tokenAccounts: input.walletTokenAccounts,
            },
        });
        return { infos };
    });
}
function howToUse() {
    return __awaiter(this, void 0, void 0, function* () {
        const walletTokenAccounts = yield (0, util_1.getWalletTokenAccount)(config_1.connection, config_1.wallet.publicKey);
        clmmOwnerPositionInfo({
            walletTokenAccounts,
            wallet: config_1.wallet,
        }).then(({ infos }) => {
            /** continue with infos */
            console.log('infos', infos);
        });
    });
}
//# sourceMappingURL=clmmOwnerPositionInfo.js.map