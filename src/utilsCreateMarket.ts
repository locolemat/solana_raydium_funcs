import {
  MarketV2,
  Token,
  TOKEN_PROGRAM_ID
} from '@raydium-io/raydium-sdk';
import { Keypair, PublicKey } from '@solana/web3.js';

import {
  connection,
  DEFAULT_TOKEN,
  makeTxVersion,
  PROGRAMIDS,
  wallet,
} from '../config';
import { buildAndSendTx } from './util';

type TestTxInputInfo = {
  baseToken: Token
  quoteToken: Token
  wallet: Keypair
  lotSize: number
  tickSize: number
}

export async function createMarket(input: TestTxInputInfo) {
  // -------- step 1: make instructions --------
  const createMarketInstruments = await MarketV2.makeCreateMarketInstructionSimple({
    connection,
    wallet: input.wallet.publicKey,
    baseInfo: input.baseToken,
    quoteInfo: input.quoteToken,
    lotSize: input.lotSize, // default 1
    tickSize: input.tickSize, // default 0.01
    dexProgramId: PROGRAMIDS.OPENBOOK_MARKET,
    makeTxVersion,
  })

  return { txids: await buildAndSendTx(createMarketInstruments.innerTransactions) }
}

async function howToUse() {
  	const baseToken = new Token(TOKEN_PROGRAM_ID, new PublicKey(process.argv[2]), Number(process.argv[3]), process.argv[4], process.argv[4])
  	const quoteToken = new Token(TOKEN_PROGRAM_ID, new PublicKey(process.argv[5]), Number(process.argv[6]), process.argv[7], process.argv[7])
  	const lotSize = Number(process.argv[8])
	  const tickSize = Number(process.argv[9])
	
	createMarket({
  	baseToken,
  	quoteToken,
  	wallet: wallet,
  	lotSize,
  	tickSize
	}).then(({ txids }) => {
		/** continue with txids */
		console.log('txids', txids)
	})
  .catch((error) =>{
    console.error('ERROR:', error)
  })
}

howToUse()
