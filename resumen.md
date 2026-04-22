# TraDeck - Documentacion General del Proyecto

## 1. Resumen ejecutivo

TraDeck es una dApp para tokenizar cartas TCG como NFTs y operarlas en un mercado con dos modalidades:

- compraventa con escrow
- intercambio directo (swap) entre usuarios

El stack esta dividido en:

- Backend Hardhat + contratos Solidity
- Frontend React + Vite + TypeScript
- Proxy backend para subir metadata JSON a IPFS mediante Pinata sin exponer secretos en cliente

El sistema soporta 2 redes:

- Hardhat local (chainId 31337)
- Sepolia (chainId 11155111)

---

## 2. Arquitectura

### 2.1 Estructura principal

- backend/: contratos, tests, despliegue y proxy Pinata
- frontend/: interfaz web, integracion wallet y capa de lectura/escritura on-chain

### 2.2 Componentes

1. Contrato ERC20 TraDeckCoin
1. Contrato ERC721 TraDeckNFT
1. Frontend Web3 que indexa eventos Transfer para construir vistas
1. Proxy HTTP para IPFS con autenticacion JWT de Pinata

### 2.3 Flujo de datos

1. El usuario crea metadata de carta desde frontend
1. Frontend llama al proxy para pinnear JSON en Pinata
1. Proxy devuelve ipfs://CID
1. Frontend ejecuta mintCard(tokenURI)
1. Frontend relee blockchain y reconstruye estado (coleccion, mercado, historial)

---

## 3. Smart contracts

### 3.1 TraDeckCoin (ERC20)

Archivo: backend/contracts/TraDeckCoin.sol

Funciones clave:

- constructor(): mintea supply inicial al deployer
- airdrop(): mintea 1000 TDC para pruebas al caller

Uso funcional:

- Moneda de pago del mercado
- Permite bootstrap rapido de usuarios para testing local

### 3.2 TraDeckNFT (ERC721 + marketplace)

Archivo: backend/contracts/TraDeckNFT.sol

Funciones clave:

- mintCard(tokenURI)
- listForSale(tokenId, price)
- buyCard(tokenId)
- confirmDelivery(tokenId)
- proposeSwap(myTokenId, wantedTokenId)
- acceptSwap(proposerTokenId)
- cancelSwap(myTokenId)

Modelo de compraventa:

1. El vendedor lista y el NFT pasa al contrato
1. El comprador paga en TDC y queda en estado escrow
1. El comprador confirma entrega
1. El contrato libera pago al vendedor y NFT al comprador

Modelo de swap:

1. Un usuario propone intercambio por otro token
1. El propietario del token objetivo acepta
1. El intercambio se ejecuta de forma atomica

---

## 4. Backend e infraestructura

### 4.1 Hardhat

Archivo: backend/hardhat.config.ts

- Solidity: 0.8.28
- Artifacts dirigidos a frontend/src/artifacts
- Red Sepolia declarada solo si existe SEPOLIA_RPC_URL

### 4.2 Modulo de despliegue

Archivo: backend/ignition/modules/TraDeck.ts

Despliega:

1. TraDeckCoin
1. TraDeckNFT pasando direccion de coin al constructor

### 4.3 Proxy Pinata

Archivo: backend/scripts/pinata-proxy.mjs

Endpoint:

- POST /api/pinata/pin-json

Comportamiento:

- valida PINATA_JWT
- recibe nombre + objeto json
- sube como archivo JSON a Pinata v3 Files API
- devuelve cid, uri ipfs:// y URL gateway

Seguridad y red:

- CORS configurable por lista de origenes
- soporte para red Pinata public/private via PINATA_UPLOAD_NETWORK

---

## 5. Frontend y funcionamiento

### 5.1 Tecnologias

- React 18
- TypeScript
- Vite
- ethers v6
- react-router-dom

### 5.2 Rutas principales

Archivo: frontend/src/App.tsx

- / : Inicio
- /coleccion : cartas del usuario
- /crear : mint manual o desde APIs
- /mercado : compra, escrow y swaps
- /historial : timeline y veracidad on-chain
- /documentacion : guia de uso, FAQ, troubleshooting, autores y licencia

### 5.3 Funcionalidades implementadas

1. Conexion MetaMask con deteccion de cuenta y red
1. Cambio de red objetivo (local/sepolia)
1. Indicador visual de chainId correcta o incorrecta
1. Airdrop de TDC desde UI
1. Indexacion por eventos Transfer para estado global
1. Crear carta:
	- modo manual
	- busqueda MTG (Scryfall)
	- busqueda Pokemon (TCGdex SDK)
1. MTG con selector de versiones/prints de una carta
1. Generacion de serial PSA aleatorio
1. Subida metadata a IPFS via proxy seguro
1. Listado en venta, compra y confirmacion de entrega
1. Propuesta, aceptacion y cancelacion de swaps
1. Filtros de mercado (texto, juego, estado, precio)
1. Filtro de juego en Mi coleccion
1. Historial por carta con hash completo de bloque y transaccion
1. Verificador de veracidad on-chain
1. Modo demo de manipulacion local de vista (hack local)
1. Popup de comprobacion manual con cadena de bloques N y N-1
1. Toasts en esquina inferior derecha con auto-cierre

---

## 6. Cambios realizados durante esta iteracion

Este bloque resume el trabajo hecho en la sesion actual:

1. Conexion completa de entorno local con direcciones de despliegue reales
1. Creacion/configuracion de backend/.env para proxy Pinata
1. Correccion de CORS para localhost y 127.0.0.1
1. Migracion de Pinata legacy a Pinata v3 Files API
1. Migracion de Pokemon TCG API (pago) a TCGdex SDK (gratuito)
1. Mejora de busqueda MTG para manejar prints/versiones
1. Cambio de copy en UI: Magic: The Gathering y PSA Serial Number
1. Mejora visual y filtro de juego en Mi coleccion
1. Indicador verde/rojo de coherencia de chainId
1. Mejora de sesion wallet para cambios de cuenta y desconexion
1. Toasts auto-dismiss a 5 segundos
1. Verificacion de trazabilidad y checks on-chain mas estrictos
1. Historial ampliado con datos completos de bloque y tx hash
1. Modo hack local para demostrar deteccion de alteraciones
1. Nueva seccion Comprobacion manual con popup explicativo y visual
1. Nueva pagina en frontend con documentacion de uso y FAQ
1. Soporte de cambio de red MetaMask mejorado para agregar Sepolia si no existe
1. Script de sincronizacion de direcciones deployadas a frontend/.env (local y sepolia)
1. Script one-click start-local.cmd para levantar entorno local completo

---

## 7. Configuracion de entorno

### 7.1 Backend (.env)

Referencia base:

- .env.example (raiz): variables de Sepolia
- backend/.env.pinata.example: variables del proxy

Variables usadas:

- SEPOLIA_RPC_URL
- PRIVATE_KEY
- PINATA_JWT
- PINATA_PROXY_PORT
- PINATA_PROXY_ALLOWED_ORIGIN
- PINATA_UPLOAD_NETWORK

Ejemplo recomendado de origenes CORS en desarrollo local:

PINATA_PROXY_ALLOWED_ORIGIN=http://localhost:5173,http://127.0.0.1:5173

### 7.2 Frontend (.env)

Referencia base: frontend/.env.example

Variables principales:

- VITE_LOCAL_RPC_URL
- VITE_SEPOLIA_RPC_URL
- VITE_LOCAL_CHAIN_ID
- VITE_SEPOLIA_CHAIN_ID
- VITE_LOCAL_TRADECK_NFT
- VITE_LOCAL_TRADECK_COIN
- VITE_SEPOLIA_TRADECK_NFT
- VITE_SEPOLIA_TRADECK_COIN
- VITE_LOCAL_DEPLOY_BLOCK
- VITE_SEPOLIA_DEPLOY_BLOCK
- VITE_PINATA_PROXY_URL

Nota: Removida VITE_POKEMON_TCG_API_KEY (pokemontcg.io es de pago, migramos a TCGdex SDK gratuito)

Nota: en local ya se ha trabajado con estas direcciones de ejemplo funcionales:

- NFT: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
- COIN: 0x5FbDB2315678afecb367f032d93F642f64180aa3

---

## 8. Bring up E2E local

Requisitos:

- Node.js 20+
- MetaMask
- Windows (cmd/powershell) para usar start-local.cmd

### Arranque rapido (recomendado)

Desde la raiz del repo:

- start-local.cmd

Este comando abre y orquesta automaticamente:

- hardhat node
- deploy local
- sync de direcciones a frontend/.env
- proxy pinata
- frontend dev

### Paso a paso

1. Instalar dependencias

En backend:

- npm.cmd install

En frontend:

- npm.cmd install

2. Compilar contratos

- cd backend
- npm.cmd run compile

3. Arrancar nodo local Hardhat (terminal 1)

- npm.cmd run node

4. Desplegar contratos en local (terminal 2)

- cd backend
- npm.cmd run deploy:local

5. Configurar frontend/.env con direcciones desplegadas y deploy block

6. Arrancar proxy Pinata (terminal 3)

- cd backend
- npm.cmd run pinata:proxy

7. Arrancar frontend (terminal 4)

- cd frontend
- npm.cmd run dev

8. En MetaMask

- importar cuentas de Hardhat de testing
- seleccionar red local 31337

9. Flujo de prueba completo

- conectar wallet
- pedir airdrop
- crear carta
- listar carta
- comprar con otra cuenta
- confirmar entrega
- revisar historial y comprobacion manual

---

## 9. Despliegue en Sepolia

1. Configurar backend/.env con:

- SEPOLIA_RPC_URL
- PRIVATE_KEY

2. Desplegar contratos

- cd backend
- npm.cmd run deploy:sepolia:sync

3. Si quieres sincronizar manualmente despues del deploy:

- cd backend
- npm.cmd run sync:env:sepolia

4. Verificar frontend/.env:

- VITE_SEPOLIA_TRADECK_NFT
- VITE_SEPOLIA_TRADECK_COIN
- VITE_SEPOLIA_DEPLOY_BLOCK

5. En frontend seleccionar red objetivo Sepolia

6. Asegurar que MetaMask tambien este en Sepolia

7. Construir version productiva si aplica:

- cd frontend
- npm.cmd run build

---

## 10. Comandos utiles

Backend:

- npm.cmd run compile
- npm.cmd run test
- npm.cmd run node
- npm.cmd run deploy:local
- npm.cmd run deploy:sepolia
- npm.cmd run deploy:local:sync
- npm.cmd run deploy:sepolia:sync
- npm.cmd run sync:env:local
- npm.cmd run sync:env:sepolia
- npm.cmd run pinata:proxy

Frontend:

- npm.cmd run dev
- npm.cmd run build
- npm.cmd run preview

Raiz del repositorio (Windows):

- start-local.cmd

---

## 11. QA y verificacion

### 11.1 Backend

- Ejecutar tests en backend/test/TraDeckNFT.test.ts
- Validar flujos: mint, compra con escrow, confirmacion, swap y cancelacion

### 11.2 Frontend

- Build TypeScript + Vite sin errores
- Probar login wallet, cambio de cuenta y red
- Probar creacion de cartas manual + MTG + Pokemon
- Probar compraventa y swaps
- Probar historial, verificador y popup de comprobacion manual

---

## 12. Troubleshooting

### Error CORS al mintear

Sintoma:

- Failed to fetch al llamar al proxy

Causa comun:

- mismatch entre localhost y 127.0.0.1

Solucion:

- incluir ambos origenes en PINATA_PROXY_ALLOWED_ORIGIN
- reiniciar proxy

### Error Pinata NO_SCOPES_FOUND

Causa:

- JWT sin permisos compatibles con endpoint legacy

Solucion aplicada:

- migracion a Pinata v3 Files API (uploads.pinata.cloud/v3/files)

### Puerto ocupado en proxy

Sintoma:

- EADDRINUSE en 8787

Solucion:

- cerrar proceso anterior o cambiar PINATA_PROXY_PORT

### En PowerShell npm no ejecuta

Sintoma:

- bloqueo de npm.ps1 por politica de ejecucion

Solucion:

- usar npm.cmd en lugar de npm

---

## 13. Seguridad

1. Nunca exponer PINATA_JWT ni private keys en frontend
1. Mantener .env fuera de control de versiones
1. Usar permisos minimos en credenciales de Pinata
1. Rotar credenciales si fueron compartidas en canales no seguros

---

## 14. Limitaciones actuales del contrato

1. No existe cancelacion de venta una vez listada
1. No hay timeout de escrow
1. Si el comprador no confirma entrega, la operacion queda bloqueada

Estas limitaciones se muestran en UI con advertencias explicitas.

---

## 15. Siguientes mejoras recomendadas

1. Implementar cancelListing en contrato
1. Implementar timeout o mecanismo de resolucion de escrow
1. Emitir eventos de negocio mas detallados para indexacion
1. Considerar indexador dedicado si crece volumen de eventos
1. Completar despliegue y smoke tests en Sepolia

---

## 16. Estado actual

El proyecto esta operativo como MVP E2E en local, con:

- minting de cartas
- metadata en IPFS via proxy seguro
- compra con escrow
- swaps
- historial on-chain
- verificacion de veracidad y comprobacion manual visual

Documentacion lista para desarrollo, demo y onboarding tecnico.
