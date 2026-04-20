# TraDeck Frontend

Frontend en React + Vite + TypeScript para TraDeck.

## Requisitos

- Node.js 20+
- MetaMask en el navegador
- Contratos desplegados en local o Sepolia
- Proxy de Pinata activo para pinnear metadata a IPFS

## Configuracion

1. Copia variables de entorno:

```bash
copy .env.example .env
```

2. Rellena direcciones y bloques de despliegue:

- `VITE_LOCAL_TRADECK_NFT`
- `VITE_LOCAL_TRADECK_COIN`
- `VITE_SEPOLIA_TRADECK_NFT`
- `VITE_SEPOLIA_TRADECK_COIN`
- `VITE_LOCAL_DEPLOY_BLOCK`
- `VITE_SEPOLIA_DEPLOY_BLOCK`

## Ejecutar

```bash
npm install
npm run dev
```

En PowerShell con politica restrictiva usa:

```bash
npm.cmd install
npm.cmd run dev
```

## Funcionalidades MVP implementadas

- Login con MetaMask
- Deteccion automatica de cartas de la wallet conectada
- Creacion manual de carta
- Busqueda de cartas MTG (Scryfall)
- Busqueda de cartas Pokemon (Pokemon TCG API v2)
- Generacion de numero de serie aleatorio tipo PSA
- Metadata en IPFS via proxy Pinata
- Marketplace con buscador y filtros
- Operaciones de compra y confirmacion de entrega
- Propuestas y aceptacion/cancelacion de intercambio
- Historial on-chain por carta y verificacion de token URI + serie

## Nota de contrato

El contrato actual no incluye cancelacion de venta ni timeout de escrow. Si un comprador no confirma entrega, la operacion queda bloqueada.
