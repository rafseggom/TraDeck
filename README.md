# TraDeck - Backend (Smart Contracts)

Bienvenido a la sección del Backend de TraDeck. Este directorio contiene todos los Smart Contracts, scripts de despliegue y tests que conforman el núcleo financiero y descentralizado de la aplicación.

## Smart Contracts Principales
Todo el ecosistema se basa en la interacción de dos contratos inteligentes:

1. **TraDeckCoin (TDKC):** El token ERC20 nativo. Actúa como el dinero del juego.
   - Incluye una función pública `airdrop()` que actúa como "banco central", regalando 1.000 TDKC a cualquier usuario nuevo para que pueda empezar a jugar y testear.

2. **TraDeckNFT (El Mercado):** Contrato que gestiona las cartas (ERC721) y el sistema de tienda.
   - **Escrow Seguro (Compraventa):** Sistema que retiene los tokens del comprador (`buyCard`) en el contrato inteligente hasta que confirma que ha recibido la carta (`confirmDelivery`), momento en el que el vendedor recibe los fondos.
   - **Intercambio Atómico (Trueque):** Permite a los usuarios intercambiar cartas de forma directa y simultánea (`proposeSwap`, `acceptSwap`), eliminando la posibilidad de estafas.

## Guía de uso rápido (backend)

Sigue estos pasos para arrancar el entorno de desarrollo local, compilar los contratos y conectarlos con la interfaz.

## Fase 1 (prioridad actual)

Esta fase deja listo lo siguiente:

1. Sepolia operativa para contratos + frontend
2. Pagina de documentacion dentro de la web (`/documentacion`)
3. Script one-click para levantar todo en local

### Arranque local simple (Windows)

Desde la raiz del repo:

```bat
start-local.cmd
```

Este script lanza Hardhat node, despliega en local, sincroniza direcciones al frontend, arranca proxy Pinata y frontend.

### Comandos nuevos de sincronizacion de entorno

En `backend/`:

```bash
npm run sync:env:local
npm run sync:env:sepolia
```

Comandos combinados deploy + sync:

```bash
npm run deploy:local:sync
npm run deploy:sepolia:sync
```

Con esto se actualizan automaticamente en `frontend/.env`:

- VITE_LOCAL_TRADECK_COIN / VITE_LOCAL_TRADECK_NFT / VITE_LOCAL_DEPLOY_BLOCK
- VITE_SEPOLIA_TRADECK_COIN / VITE_SEPOLIA_TRADECK_NFT / VITE_SEPOLIA_DEPLOY_BLOCK

## 1️. Instalación Inicial
Si es la primera vez que clonas el repositorio o si has borrado la carpeta `node_modules`, instala todas las dependencias necesarias:
```bash
cd backend
npm install
```

## 2. Compilación de Contratos
Cada vez que modifiques el código de un archivo `.sol` dentro de `contracts/`, debes recompilar el proyecto. Esto genera nuevos archivos ABI y los envía automáticamente al Frontend:
```bash
npx hardhat compile
```

## 3. Ejecutar Pruebas
Para ejecutar los tests del proyecto:
```bash
npx hardhat test
```

## 4. Levantar el Servidor Local (Nodo)
Para simular la blockchain de Ethereum y poder interactuar con ella desde la página web, enciende el nodo local. **Deja esta terminal abierta**:
```bash
npx hardhat node
```

## 5. Deslpiegue de Contratos
Con el nodo encendido, abre **otra terminal**, asegúrate de estar en la carpeta ``backend`` y ejecuta el script de despliegue:
```bash
npx hardhat ignition deploy ignition/modules/TraDeck.ts --network localhost
```

**Importante para el Frontend**: > Al ejecutar el comando de despliegue, la terminal te devolverá dos direcciones (ej: 0x5Fb...). Cópialas y úsalas en el código de React para conectar la dApp con los contratos TraDeckCoin y TraDeckNFT

Alternativa recomendada para no copiar manualmente:

```bash
npm run deploy:local:sync
```

### Sepolia (deploy + sync)

1. Configura `.env` en raiz con `SEPOLIA_RPC_URL` y `PRIVATE_KEY`
2. Ejecuta:

```bash
cd backend
npm run deploy:sepolia:sync
```

3. Arranca frontend y selecciona red Sepolia en la UI

# Sample Hardhat 3 Beta Project (`mocha` and `ethers`)

This project showcases a Hardhat 3 Beta project using `mocha` for tests and the `ethers` library for Ethereum interactions.

To learn more about the Hardhat 3 Beta, please visit the [Getting Started guide](https://hardhat.org/docs/getting-started#getting-started-with-hardhat-3). To share your feedback, join our [Hardhat 3 Beta](https://hardhat.org/hardhat3-beta-telegram-group) Telegram group or [open an issue](https://github.com/NomicFoundation/hardhat/issues/new) in our GitHub issue tracker.

## Project Overview

This example project includes:

- A simple Hardhat configuration file.
- Foundry-compatible Solidity unit tests.
- TypeScript integration tests using `mocha` and ethers.js
- Examples demonstrating how to connect to different types of networks, including locally simulating OP mainnet.

## Usage

### Running Tests

To run all the tests in the project, execute the following command:

```shell
npx hardhat test
```

You can also selectively run the Solidity or `mocha` tests:

```shell
npx hardhat test solidity
npx hardhat test mocha
```

### Make a deployment to Sepolia

This project includes an example Ignition module to deploy the contract. You can deploy this module to a locally simulated chain or to Sepolia.

To run the deployment to a local chain:

```shell
npx hardhat ignition deploy ignition/modules/Counter.ts
```

To run the deployment to Sepolia, you need an account with funds to send the transaction. The provided Hardhat configuration includes a Configuration Variable called `SEPOLIA_PRIVATE_KEY`, which you can use to set the private key of the account you want to use.

You can set the `SEPOLIA_PRIVATE_KEY` variable using the `hardhat-keystore` plugin or by setting it as an environment variable.

To set the `SEPOLIA_PRIVATE_KEY` config variable using `hardhat-keystore`:

```shell
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

After setting the variable, you can run the deployment with the Sepolia network:

```shell
npx hardhat ignition deploy --network sepolia ignition/modules/Counter.ts
```
