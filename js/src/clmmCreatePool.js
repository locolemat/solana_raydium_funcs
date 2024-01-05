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
const bn_js_1 = __importDefault(require("bn.js"));
const decimal_js_1 = __importDefault(require("decimal.js"));
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../config");
const formatClmmConfigs_1 = require("./formatClmmConfigs");
const util_1 = require("./util");
function clmmCreatePool(input) {
    return __awaiter(this, void 0, void 0, function* () {
        // -------- pre-action: fetch basic ammConfig info --------
        const _ammConfig = (yield (0, formatClmmConfigs_1.formatClmmConfigs)(config_1.PROGRAMIDS.CLMM.toString()))[input.clmmConfigId];
        const ammConfig = Object.assign(Object.assign({}, _ammConfig), { id: new web3_js_1.PublicKey(_ammConfig.id) });
        // -------- step 1: make create pool instructions --------
        const makeCreatePoolInstruction = yield raydium_sdk_1.Clmm.makeCreatePoolInstructionSimple({
            connection: config_1.connection,
            programId: config_1.PROGRAMIDS.CLMM,
            owner: input.wallet.publicKey,
            mint1: input.baseToken,
            mint2: input.quoteToken,
            ammConfig,
            initialPrice: input.startPoolPrice,
            startTime: input.startTime,
            makeTxVersion: config_1.makeTxVersion,
            payer: config_1.wallet.publicKey,
        });
        // -------- step 2: (optional) get mockPool info --------
        const mockPoolInfo = raydium_sdk_1.Clmm.makeMockPoolInfo({
            programId: config_1.PROGRAMIDS.CLMM,
            mint1: input.baseToken,
            mint2: input.quoteToken,
            ammConfig,
            createPoolInstructionSimpleAddress: makeCreatePoolInstruction.address,
            owner: input.wallet.publicKey,
            initialPrice: input.startPoolPrice,
            startTime: input.startTime
        });
        return { txids: yield (0, util_1.buildAndSendTx)(makeCreatePoolInstruction.innerTransactions), mockPoolInfo };
    });
}
function howToUse() {
    return __awaiter(this, void 0, void 0, function* () {
        const baseToken = config_1.DEFAULT_TOKEN.USDC; // USDC
        const quoteToken = config_1.DEFAULT_TOKEN.RAY; // RAY
        const clmmConfigId = 'E64NGkDLLCdQ2yFNPcavaKptrEgmiQaNykUuLC1Qgwyp';
        const startPoolPrice = new decimal_js_1.default(1);
        const startTime = new bn_js_1.default(Math.floor(new Date().getTime() / 1000));
        clmmCreatePool({
            baseToken,
            quoteToken,
            clmmConfigId,
            wallet: config_1.wallet,
            startPoolPrice,
            startTime,
        }).then(({ txids, mockPoolInfo }) => {
            /** continue with txids */
            console.log('txids', txids);
        });
    });
}
//# sourceMappingURL=clmmCreatePool.js.map