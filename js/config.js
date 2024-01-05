"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TOKEN = exports.addLookupTableInfo = exports.makeTxVersion = exports.RAYDIUM_MAINNET_API = exports.ENDPOINT = exports.PROGRAMIDS = exports.connection = exports.wallet = exports.rpcToken = exports.rpcUrl = void 0;
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const web3_js_1 = require("@solana/web3.js");
exports.rpcUrl = 'https://xxx.xxx.xxx/';
exports.rpcToken = undefined;
const pk = [227, 141, 125, 240, 116, 64, 149, 175, 208, 110, 191, 216, 218, 172, 137, 212, 96, 42, 3, 73, 192, 66, 34, 230, 113, 185, 140, 141, 14, 167, 20, 57, 80, 174, 210, 218, 173, 46, 126, 8, 69, 199, 153, 238, 241, 141, 43, 147, 7, 228, 45, 37, 88, 1, 12, 194, 66, 68, 112, 130, 160, 23, 250, 37];
exports.wallet = web3_js_1.Keypair.fromSecretKey(Uint8Array.from(pk));
exports.connection = new web3_js_1.Connection('https://api.mainnet-beta.solana.com');
exports.PROGRAMIDS = raydium_sdk_1.MAINNET_PROGRAM_ID;
exports.ENDPOINT = raydium_sdk_1.ENDPOINT;
exports.RAYDIUM_MAINNET_API = raydium_sdk_1.RAYDIUM_MAINNET;
exports.makeTxVersion = raydium_sdk_1.TxVersion.V0; // LEGACY
exports.addLookupTableInfo = raydium_sdk_1.LOOKUP_TABLE_CACHE; // only mainnet. other = undefined
exports.DEFAULT_TOKEN = {
    'SOL': new raydium_sdk_1.Currency(9, 'USDC', 'USDC'),
    'WSOL': new raydium_sdk_1.Token(raydium_sdk_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey('So11111111111111111111111111111111111111112'), 9, 'WSOL', 'WSOL'),
    'USDC': new raydium_sdk_1.Token(raydium_sdk_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), 6, 'USDC', 'USDC'),
    'RAY': new raydium_sdk_1.Token(raydium_sdk_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'), 6, 'RAY', 'RAY'),
    'AART': new raydium_sdk_1.Token(raydium_sdk_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey('F3nefJBcejYbtdREjui1T9DPh5dBgpkKq7u2GAAMXs5B'), 6, 'AART', 'AART'),
    'RAY_USDC-LP': new raydium_sdk_1.Token(raydium_sdk_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey('FGYXP4vBkMEtKhxrmEBcWN8VNmXX8qNgEJpENKDETZ4Y'), 6, 'RAY-USDC', 'RAY-USDC'),
};
//# sourceMappingURL=config.js.map