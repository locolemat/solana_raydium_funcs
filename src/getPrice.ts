import assert from 'assert';

import { Connection, PublicKey,} from "@solana/web3.js";

import {
  jsonInfo2PoolKeys,
  Liquidity,
  LiquidityPoolKeys,
  Percent,
  Token,
  TOKEN_PROGRAM_ID,
  TokenAmount,
} from '@raydium-io/raydium-sdk';

import {
  connection,
  DEFAULT_TOKEN,
  makeTxVersion,
  wallet
} from '../config';

import { formatAmmKeysById } from './formatAmmKeysById';

async function grabPrice() {
  const targetPoolInfo = await formatAmmKeysById(process.argv[2])
  assert(targetPoolInfo, 'cannot find the target pool')
  const poolKeys = jsonInfo2PoolKeys(targetPoolInfo) as LiquidityPoolKeys
  const inputToken = new Token(TOKEN_PROGRAM_ID, new PublicKey(process.argv[3]), Number(process.argv[4]), process.argv[5], process.argv[5])
  const outputToken = new Token(TOKEN_PROGRAM_ID, new PublicKey(process.argv[6]), Number(process.argv[7]), process.argv[8], process.argv[8])
  const inputTokenAmount = new TokenAmount(inputToken, Number(process.argv[9]))
  const slippage = new Percent(1, 100)
  
  const { amountOut, minAmountOut } = Liquidity.computeAmountOut({
    poolKeys: poolKeys,
    poolInfo: await Liquidity.fetchInfo({ connection, poolKeys }),
    amountIn: inputTokenAmount,
    currencyOut: outputToken,
    slippage: slippage,
  })

  console.log(minAmountOut)
}

async function howToUse(){
  await grabPrice()
}

howToUse()