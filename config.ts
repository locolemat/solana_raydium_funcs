import {
  ENDPOINT as _ENDPOINT,
  Currency,
  LOOKUP_TABLE_CACHE,
  MAINNET_PROGRAM_ID,
  RAYDIUM_MAINNET,
  Token,
  TOKEN_PROGRAM_ID,
  TxVersion,
} from '@raydium-io/raydium-sdk';
import {
  Connection,
  Keypair,
  PublicKey,
} from '@solana/web3.js';

export const rpcUrl: string = 'https://xxx.xxx.xxx/'
export const rpcToken: string | undefined = undefined

const pk=[227, 141, 125, 240, 116, 64, 149, 175, 208, 110, 191, 216, 218, 172, 137, 212, 96, 42, 3, 73, 192, 66, 34, 230, 113, 185, 140, 141, 14, 167, 20, 57, 80, 174, 210, 218, 173, 46, 126, 8, 69, 199, 153, 238, 241, 141, 43, 147, 7, 228, 45, 37, 88, 1, 12, 194, 66, 68, 112, 130, 160, 23, 250, 37];

export const wallet = Keypair.fromSecretKey(Uint8Array.from(pk));

export const connection = new Connection('https://api.mainnet-beta.solana.com');

export const PROGRAMIDS = MAINNET_PROGRAM_ID;

export const ENDPOINT = _ENDPOINT;

export const RAYDIUM_MAINNET_API = RAYDIUM_MAINNET;

export const makeTxVersion = TxVersion.V0; // LEGACY

export const addLookupTableInfo = LOOKUP_TABLE_CACHE // only mainnet. other = undefined

export const DEFAULT_TOKEN = {
  'SOL': new Currency(9, 'USDC', 'USDC'),
  'WSOL': new Token(TOKEN_PROGRAM_ID, new PublicKey('So11111111111111111111111111111111111111112'), 9, 'WSOL', 'WSOL'),
  'USDC': new Token(TOKEN_PROGRAM_ID, new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), 6, 'USDC', 'USDC'),
  'RAY': new Token(TOKEN_PROGRAM_ID, new PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'), 6, 'RAY', 'RAY'),
  'AART': new Token(TOKEN_PROGRAM_ID, new PublicKey('F3nefJBcejYbtdREjui1T9DPh5dBgpkKq7u2GAAMXs5B'), 6, 'AART', 'AART'),
  'RAY_USDC-LP': new Token(TOKEN_PROGRAM_ID, new PublicKey('FGYXP4vBkMEtKhxrmEBcWN8VNmXX8qNgEJpENKDETZ4Y'), 6, 'RAY-USDC', 'RAY-USDC'),
}