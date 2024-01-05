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
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../config");
const util_1 = require("./util");
(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log({
        txids: yield (0, util_1.buildAndSendTx)([
            {
                instructionTypes: [
                    raydium_sdk_1.InstructionType.test,
                ],
                instructions: [
                    (0, spl_token_1.createSetAuthorityInstruction)(new web3_js_1.PublicKey(' mint address '), config_1.wallet.publicKey, spl_token_1.AuthorityType.FreezeAccount, null // if will delete , change -> new PublicKey(' new authority address ')
                    )
                ],
                signers: [],
            }
        ])
    });
}))();
//# sourceMappingURL=utilsChangeMintAuthority.js.map