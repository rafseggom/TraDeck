# TraDeck - Trading Card Game & Marketplace

Bienvenido a TraDeck. Este proyecto es una aplicación descentralizada (dApp) enfocada en el coleccionismo, compraventa e intercambio de cartas NFT, utilizando su propia moneda (TDKC). 

## Despliegue en Vivo (Jugar Ahora)

TraDeck ya se encuentra desplegado y listo para usar de forma pública en la red de pruebas de Sepolia. Puedes acceder a la plataforma directamente desde aquí:

**[Probar TraDeck (Despliegue en Vercel)](https://tradeck.vercel.app/)**

**Requisitos para probarlo:** Para interactuar con esta aplicación necesitarás tener instalada la extensión **MetaMask** en tu navegador. Deberás configurar MetaMask en la red de pruebas **Sepolia** y disponer de algo de *Sepolia ETH* para pagar el gas de las transacciones. Puedes conseguir fondos gratuitos buscando en Google cualquier "Sepolia Faucet" (como Alchemy Faucet o Google Web3 Faucet) e introduciendo tu dirección pública. Recomendamos [Sepolia Faucet](https://sepolia-faucet.pk910.de/), es "infinita" y puedes conseguir ETH para varias cuentas.

---

## Requisitos Previos (Instalación Local)

Si quieres ejecutar este programa en tu propio ordenador desde cero, asegúrate de tener preparado lo siguiente:

1. **Node.js:** Necesario para ejecutar el entorno.
2. **MetaMask:** Extensión de navegador para firmar transacciones.
3. **Configurar Cartera local:**
   Cuando ejecutes el entorno local, la herramienta Hardhat creará una blockchain de pruebas en tu máquina y te dará varias "Private Keys" (Claves privadas) cargadas con 10.000 ETH ficticios cada una. 
   Para usarlas en la aplicación web, debes abrir MetaMask, añadir la red manual `Localhost 8545` (Chain ID: 31337, RPC URL: http://127.0.0.1:8545) e **Importar Cuenta** pegando una de esas claves privadas. Es recomendable importar al menos dos cuentas distintas para poder simular compras e intercambios entre usuarios.
4. **Configurar Cartera Sepolia:** Puedes, alternativamente, activar las redes de prueba en MetaMask, copiar la dirección pública de tu Wallet de ETH o Sepolia y conseguir ETH desde un faucet. Con ello ya podrás probar la aplicación en la red de prueba Sepolia.

---

## Guía de Arranque Rápido Local (Windows)

Hemos preparado un script automático que hace todo el trabajo por ti. Desde la raíz del repositorio, simplemente haz doble clic o ejecuta en la consola:

```code
start-local.cmd
```

**¿Qué hace este script exactamente?**
- Instala todas las dependencias (`node_modules`) tanto del backend como del frontend.
- Crea automáticamente los archivos de configuración `.env` necesarios.
- Levanta el nodo blockchain de Hardhat en una ventana.
- Despliega los contratos inteligentes en tu red local.
- Sincroniza las direcciones generadas para que el Frontend las reconozca automáticamente.
- Arranca el proxy de Pinata en una segunda ventana.
- Lanza el servidor de desarrollo del Frontend en una tercera ventana.

Al terminar, solo tienes que abrir la dirección local que te marque el Frontend en tu navegador con MetaMask conectado a Localhost.

---

## Smart Contracts Principales

Todo el ecosistema se basa en la interacción de dos contratos inteligentes ubicados en el backend:

1. **TraDeckCoin (TDKC):** El token ERC20 nativo. Actúa como el dinero del juego.
   - Incluye una función pública `airdrop()` que actúa como "banco central", regalando 1.000 TDKC a cualquier usuario nuevo para que pueda empezar a jugar y testear.

2. **TraDeckNFT (El Mercado):** Contrato que gestiona las cartas (ERC721) y el sistema de tienda.
   - **Escrow Seguro (Compraventa):** Sistema que retiene los tokens del comprador (`buyCard`) en el contrato inteligente hasta que confirma que ha recibido la carta (`confirmDelivery`), momento en el que el vendedor recibe los fondos.
   - **Intercambio Atómico (Trueque):** Permite a los usuarios intercambiar cartas de forma directa y simultánea (`proposeSwap`, `acceptSwap`), eliminando la posibilidad de estafas.

---

## Comandos de Sincronización de Entorno (Fase 1)

El proyecto incluye scripts diseñados para automatizar la comunicación entre los contratos desplegados y la interfaz web.

En la carpeta `backend/`, puedes sincronizar manualmente las direcciones de los contratos con el frontend usando:

```code
npm run sync:env:local
npm run sync:env:sepolia
```
Comandos combinados de despliegue + sincronización:

```code
npm run deploy:local:sync
npm run deploy:sepolia:sync
```

Con esto se actualizan automáticamente en el archivo `frontend/.env` las siguientes variables según el entorno:
- `VITE_LOCAL_TRADECK_COIN` / `VITE_LOCAL_TRADECK_NFT` / `VITE_LOCAL_DEPLOY_BLOCK`
- `VITE_SEPOLIA_TRADECK_COIN` / `VITE_SEPOLIA_TRADECK_NFT` / `VITE_SEPOLIA_DEPLOY_BLOCK`

---

## Guía Manual del Backend

Si prefieres ejecutar los pasos a mano, eres desarrollador y necesitas compilar cambios, o no usas Windows, aquí tienes los comandos paso a paso.

### 1. Instalación Inicial
Asegúrate de instalar las dependencias si es la primera vez o has borrado `node_modules`:

```code
cd backend
npm install
```

### 2. Compilación de Contratos
Cada vez que modifiques el código de un archivo `.sol` dentro de `contracts/`, debes recompilar el proyecto para generar los nuevos ABIs y enviarlos al frontend:

```code
npx hardhat compile
```

### 3. Ejecutar Pruebas
Para correr los tests automatizados del proyecto:

```code
npx hardhat test
```
### 4. Levantar el Servidor Local (Nodo)
Enciende la simulación de blockchain local y **deja esta terminal abierta**:

```code
npx hardhat node
```

### 5. Despliegue de Contratos (Local)
Abre **otra terminal** en la carpeta `backend` y ejecuta el script de despliegue recomendado que sincroniza automáticamente las direcciones:

```code
npm run deploy:local:sync
```

*(Alternativamente, puedes usar `npx hardhat ignition deploy ignition/modules/TraDeck.ts --network localhost` y copiar las direcciones manualmente).*

### 6. Despliegue en Sepolia
Si has realizado cambios en los contratos y quieres actualizar la versión pública:
1. Configura el archivo `.env` en la raíz del backend con tu `SEPOLIA_RPC_URL` y tu `PRIVATE_KEY`.
2. Ejecuta:

```code
npm run deploy:sepolia:sync
```

3. Arranca el frontend y selecciona la red Sepolia en la interfaz de usuario.