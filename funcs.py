from spl.token.instructions import close_account, CloseAccountParams

from spl.token.client import Token
from spl.token.core import _TokenCore

from solana.rpc.commitment import Commitment
from solana.rpc.types import TokenAccountOpts
from solana.rpc.api import RPCException, Client
from solana.transaction import Transaction

from moralis import sol_api
from solders.pubkey import Pubkey

import requests, json, os, sys, base58, subprocess


def get_secret_key(private_key: str):
    """
    Превращает некорректно называемый в Солане private_key (по факту это secret_key)
    в base58 ключ вида [10,50,180...] для подключения к Солане
    """
    byte_array = base58.b58decode(private_key)
    json_string = "[" + ",".join(map(lambda b: str(b), byte_array)) + "]"
    return json_string

def get_price_moralis(token_address:str, api_key:str):
    """
    Берёт цену указанного токена с помощью moralis (https://docs.moralis.io/)
    Для работы требуется API-ключ, он бесплатный
    """
    params = {
      "network": "mainnet",
      "address": token_address
    }

    result = sol_api.token.get_token_price(
      api_key=api_key,
      params=params,
    )

    return result

def get_price(token_address):
    """
    Возвращает цену токена (цену берёт c dexscreener)
    """
    url = f"https://api.dexscreener.com/latest/dex/tokens/{token_address}"
    exclude = ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB']
    response = requests.get(url).json()
    
    if token_address not in exclude:
        for pair in response['pairs']:
            if pair['quoteToken']['address'] == 'So11111111111111111111111111111111111111112':
                return float(pair['priceUsd'])
    else:
        return response['pairs'][0]['priceUsd']
    return None

def getSymbol(token):
    """
    По адресу возвращает символ, закрепленный за токеном
    """
    # usdc and usdt
    exclude = ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB']
    
    if token not in exclude:
        url = f"https://api.dexscreener.com/latest/dex/tokens/{token}"

        Token_Symbol = ""
        Sol_symbol=""
        try:
            response = requests.get(url)

            # Check if the request was successful (status code 200)
            if response.status_code == 200:
                resp = response.json()
                print("Response:",resp['pairs'][0]['baseToken']['symbol'])
                for pair in resp['pairs']:
                    quoteToken = pair['quoteToken']['symbol']

                    if quoteToken == 'SOL':
                        Token_Symbol = pair['baseToken']['symbol']
                        Sol_symbol = quoteToken
                        return Token_Symbol, Sol_symbol


            else:
                print(f"[getSymbol] Request failed with status code {response.status_code}")

        except requests.exceptions.RequestException as e:
            print(f"[getSymbol] error occurred: {e}")
        except: 
            a = 1

        return Token_Symbol, Sol_symbol
    else:
        if token == 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v':
            return "USDC", "SOL"
        elif token == 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB':
            return "USDT", "SOL"


def get_liquidity(token_address: str):
    """
    Берёт ликвидность токена или пары токенов с dexscreener
    Если указать один токен, будут возвращены ликвидности всех его пар
    """
    url = f"https://api.dexscreener.com/latest/dex/search/?q={token_address}"
    response = requests.get(url).json()
    if response.status_code == 200:
        data = [{'pair': f"{resp['baseToken']['symbol']}/{resp['quoteToken']['symbol']}", 'liquidity': f"{resp['liquidity']['usd']}"} for resp in response['pairs']]
        return data
    else:
        return 'Request failed with status code ' + response.status_code


def connect(secret_key: str | list, rcp_url: str):
    """
    Подключает скрипт к raydium-sdk.
    Требует secret key в формате строки либо массива чисел и url желаемого кластера.
    Функция connect должна вызываться при каждой смене действующего кошелька или кластера.
    """

    actual_secret_key = []
    if type(secret_key) is list:
        actual_secret_key = secret_key
    elif type(secret_key) is str:
        actual_secret_key = eval(get_secret_key(secret_key))
    else:
        return 'Некорректный секретный ключ'

    if len(actual_secret_key) != 64:
        return 'Некорректный секретный ключ - ключ должен содержать 64 символа.'

    subprocess.run('yarn clean', shell=True)
    
    lines = []
    with open('config.ts', 'r') as f:
        lines = f.readlines()
        for i in range(len(lines)):
            if lines[i].find('const pk') != -1:
                lines[i] = f'const pk={actual_secret_key};\n'
            if lines[i].find('export const connection') != -1:
                lines[i] = 'export const connection = new Connection(' + "'" +f"{rcp_url}" + "'" + ');\n'

    with open('config.ts', 'w') as f:
        for line in lines:
            f.write(line)

    subprocess.run('yarn build', shell=True)


def create_market(base_token: dict, quote_token: dict, lot_size: int, max_tick_size: int, makeTxVersion = True):
    """
    Создаёт маркет для двух токенов.

    base_token и quote_token = {
        "address" str: "<адрес_токена>",
        "decimals" int: n,
        "symbol" str: "<символ_токена>"
    }

    Возвращает словарь вида:

    {
        "success" bool: удалось ли создать маркет,
        "error" str: ошибка (если она есть),
        "market_id" str: id созданного маркета (если его удалось создать)
    }

    """

    """
    
    """
    output = subprocess.run(f'yarn start ./js/src/utilsCreateMarket.js {base_token["address"]} {base_token["decimals"]} {base_token["symbol"]} {quote_token["address"]} {quote_token["decimals"]} {quote_token["symbol"]} {lot_size} {max_tick_size} {makeTxVersion}', shell=True, capture_output=True)
    stdout_lines = [str(line) for line in output.stdout.splitlines()]
    market_id = ''
    for i in stdout_lines:
        if i.find('ERROR: ') != -1:
            return {'success':False, 'error': i[2:-1]}
        if i.find('txids') != -1:
            market_id = i[2:-1]

    return {'success': True, 'market_id': market_id}



def create_liquidity_pool(base_token: dict, quote_token: dict, target_market_id: str, add_base_amount: int, add_quote_amount: int):
    """
    Создаёт пул ликвидности.

    base_token и quote_token = {
        "address" str: "<адрес_токена>",
        "decimals" int: n,
        "symbol" str: "<символ_токена>"
    }

    target_market_id str: id маркета
    add_base_amount int: количество base токенов
    add_quote_amount int: количество quote токенов

    Возвращает словарь вида:

    {
        "success" bool: удалось ли создать пул,
        "error" str: ошибка (если она есть)
    }
    """

    output = subprocess.run(f'yarn start ./js/src/ammCreatePool.js {base_token["address"]} {base_token["decimals"]} {base_token["symbol"]} {quote_token["address"]} {quote_token["decimals"]} {quote_token["symbol"]} {target_market_id} {add_base_amountd} {add_quote_amount}', shell=True, capture_output=True)
    stdout_lines = [str(line) for line in output.stdout.splitlines()]
    for i in stdout_lines:
        if i.find('ERROR: ') != -1:
            return {'success':False, 'error': i[2:-1]}
        if i.find('txids') != -1:
            market_id = i[2:-1]

    return {'success': True, 'error': ''}

def swap(base_token: dict, quote_token: dict, target_pool: str, input_token_amount: int):
    """
    Свапает два токена.

    base_token и quote_token = {
        "address" str: "<адрес_токена>",
        "decimals" int: n,
        "symbol" str: "<символ_токена>"
    }

    target_pool str: адрес пула
    input_token_amount int: количество токенов, которые будем менять

    Возвращает словарь вида:

    {
        "success" bool: удалось ли свапнуть токены,
        "error" str: ошибка (если она есть)
    }
    """

    output = subprocess.run(f'yarn start ./js/src/swapOnlyAmm.js {base_token["address"]} {base_token["decimals"]} {base_token["symbol"]} {quote_token["address"]} {quote_token["decimals"]} {quote_token["symbol"]} {target_pool} {input_token_amount}', shell=True, capture_output=True)
    stdout_lines = [str(line) for line in output.stdout.splitlines()]
    for i in stdout_lines:
        if i.find('ERROR: ') != -1:
            return {'success':False, 'error': i[2:-1]}
        if i.find('txids') != -1:
            market_id = i[2:-1]

    return {'success': True, 'error': ''}




connect('5YsYUzTAHjDLLUU1DjQ5wMtRMfGsDDPvfNzeL1bfwXA3SJrZuvF9XP6ozQqWDfBgcuM3fkBpH3ddC4VTDapueScC', 'https://api.mainnet-beta.solana.com')

