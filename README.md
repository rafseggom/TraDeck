# TraDeck

TraDeck es una DApp para intercambio de cartas TCG certificadas usando NFTs (ERC-721) y flujo de escrow on-chain.

## Requisitos

- Node.js 22+
- npm

## Instalacion

```bash
npm install
```

## Variables de entorno

Crear archivo `.env` en la raiz:

```env
SEPOLIA_RPC_URL="https://your-rpc-url"
PRIVATE_KEY="0xyour64hexprivatekey"
```

Notas:
- Para trabajar en local, `PRIVATE_KEY` puede estar vacia o ausente.
- Si se define, debe tener formato hex valido (`0x` + 64 caracteres hexadecimales).

## Comandos principales

```bash
npm run compile
npm test
npm run test:solidity
npm run test:mocha
npm run node
npm run deploy:local
npm run deploy:sepolia
```

## Flujo actual implementado en TraDeck

1. Mint de carta NFT con `tokenURI`.
2. Listado de carta en marketplace con precio.
3. Compra con fondos en escrow dentro del contrato.
4. Confirmacion de entrega por parte del comprador.
5. Liquidacion atomica: transferencia del NFT al comprador y pago al vendedor.
6. Cancelacion de listado (vendedor) y cancelacion de compra (comprador).

## Estado de pruebas

- Solidity tests (Foundry style): `contracts/Counter.t.sol`
- TypeScript tests (Mocha + Ethers): `test/Counter.ts`, `test/TraDeck.test.ts`

El comando `npm test` ejecuta ambas suites.
