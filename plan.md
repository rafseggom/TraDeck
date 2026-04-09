# Plan de Proyecto Técnico: TraDeck

**Documento de Arquitectura y Especificación de Sistema**
**Autores:** Rafa Segura & Javier Luque  
**Asignatura:** Complementos de Bases de Datos (CBD)  
**Duración Estimada:** 60 horas  
**Licencia:** MIT  

---

## 1. Resumen Ejecutivo y Objetivos
**TraDeck** es una plataforma descentralizada (DApp) para el intercambio de Trading Card Games (TCG) certificadas. El objetivo principal de este proyecto es demostrar la viabilidad y las ventajas de las bases de datos distribuidas (Blockchain) frente a los Sistemas de Gestión de Bases de Datos (SGBD) tradicionales para resolver problemas de confianza, falsificación y doble gasto en activos digitales.

El proyecto prescinde de un backend centralizado (ej. Node.js o Python) y de una base de datos relacional (ej. MySQL), utilizando en su lugar un Smart Contract como motor de la lógica de negocio y la red Ethereum como capa de persistencia de estado inmutable.

---

## 2. Arquitectura de Sistemas Híbridos
El principal desafío en el desarrollo Web3 es el alto coste de almacenamiento computacional (Gas). Por ello, TraDeck implementa un patrón de diseño arquitectónico híbrido (On-Chain / Off-Chain).

### 2.1. Capa On-Chain (Base de Datos de Estado)
* **Red:** Ethereum (Testnet Sepolia para desarrollo y evidencias).
* **Motor:** Smart Contract programado en Solidity (EVM-compatible).
* **Datos Almacenados:** Únicamente información crítica transaccional.
    * `tokenId`: Clave primaria del activo.
    * `owner`: Dirección criptográfica del dueño actual.
    * `tokenURI`: Puntero (enlace) hacia los metadatos Off-Chain.
    * Estado en el mercado (precio, disponibilidad, vendedor).

### 2.2. Capa Off-Chain (Almacenamiento Descentralizado)
* **Red:** IPFS (InterPlanetary File System).
* **Datos Almacenados:** Archivos pesados y metadatos estructurados.
    * Imágenes de las cartas de alta resolución.
    * Archivos JSON con atributos (Nombre, Número de Serie PSA, Colección).
* **Integridad:** IPFS genera un Content Identifier (CID) basado en el hash criptográfico del archivo. Si un solo carácter del JSON o un píxel de la imagen cambia, el CID se altera, rompiendo el vínculo con el Smart Contract y evidenciando la manipulación.

---

## 3. Pila Tecnológica (Stack)

### 3.1. Desarrollo de Smart Contracts
* **Lenguaje:** Solidity `^0.8.24`.
* **Framework de Desarrollo:** Hardhat v3 (gestión de red local, compilación y despliegue).
* **Librerías de Seguridad:** OpenZeppelin (implementación estandarizada y auditada de `ERC721URIStorage` y control de acceso `Ownable`).
* **Testing:** Mocha y Chai (con TypeScript) simulando el comportamiento de la EVM localmente.

### 3.2. Integración y Frontend Multiplataforma
* **Conector Web3:** Ethers.js v6 (facilita la firma de transacciones y la lectura del ABI del contrato).
* **Contenedor Nativo:** Capacitor (permite empaquetar la lógica web en aplicaciones nativas para Android/iOS, solucionando problemas de despliegue multiplataforma).
* **Gestión de APIs y Oráculos:** Llamadas asíncronas simuladas a APIs externas (Pokémon TCG / Magic) para validar la existencia de la carta antes de su registro en la cadena.

---

## 4. Modelo de Datos y Lógica de Negocio

A diferencia del modelo E-R (Entidad-Relación), en Solidity se utilizan diccionarios de datos (`mappings`) y estructuras (`structs`) optimizadas para el almacenamiento en ranuras de 256 bits.

### 4.1. Estructuras de Datos Principales
* **Diccionario ERC-721 (Heredado):** Un `mapping(uint256 => address)` que actúa como tabla de asignación, relacionando el ID de la carta con la Wallet del propietario.
* **Estructura del Mercado (Listing):**
    ```solidity
    struct Listing {
        uint256 price;   // Precio de venta en wei (10^-18 ETH)
        address seller;  // Clave foranea del vendedor
        bool active;     // Flag de disponibilidad
    }
    ```
* **Libro de Órdenes:** `mapping(uint256 => Listing) public listings;`

### 4.2. Atomicidad y Sistema Escrow
El contrato implementa un patrón *Escrow* (depósito de garantía) sin intermediarios humanos.
1.  **Bloqueo de Activo:** Al ejecutar `listForSale`, la carta queda marcada en el mercado.
2.  **Retención de Fondos:** Al ejecutar `buyCard`, el contrato exige que `msg.value` (el dinero enviado) sea igual o superior al precio. El contrato actúa como bóveda reteniendo el ETH.
3.  **Cierre (Confirmación):** La función `confirmDelivery` ejecuta el cambio de propietario en el mapping ERC-721 y transfiere el ETH retenido a la wallet del vendedor en la misma transacción atómica. Si alguna línea falla, el estado hace un *rollback* automático.

---

## 5. Planificación de Fases y Cronograma (60 Horas)

| Fase | Descripción Técnica | Entregables | Horas |
| :--- | :--- | :--- | :--- |
| **Fase 1** | **Investigación y Fundamentos:** Análisis del estándar ERC-721, oráculos teóricos y diferencias entre inmutabilidad y CRUD. | Documento de diseño arquitectónico. | 10h |
| **Fase 2** | **Desarrollo Web3:** Programación en Solidity, configuración de Hardhat, despliegue en local y redacción de tests en TypeScript. | Contrato `TraDeck.sol` y suite de tests. | 15h |
| **Fase 3** | **Frontend y APIs:** Integración con Capacitor, gestión de peticiones CORS a pasarelas IPFS (Pinata) y conexión con Metamask vía Ethers.js. | App móvil/web funcional. | 20h |
| **Fase 4** | **Simulación:** Ejecución de flujos completos en Sepolia Testnet. Monitorización de consumo de Gas y posibles errores *Out of Gas*. | Hashes de TX y capturas de Etherscan. | 5h |
| **Fase 5** | **Memoria y Conclusiones:** Comparativa técnica SGBD vs Blockchain, justificación de arquitectura y formato APA. | Memoria final del proyecto. | 10h |

---

## 6. Comparativa Técnica: Bases de Datos vs TraDeck

Esta tabla fundamenta la decisión arquitectónica para la memoria de la asignatura:

| Característica | SGBD Relacional (Ej. PostgreSQL) | Blockchain Ethereum (TraDeck) |
| :--- | :--- | :--- |
| **Operaciones DML** | CRUD (Create, Read, Update, Delete) | Append-only (Solo añadir y leer). No existe *Delete* real. |
| **Control de Estado** | Centralizado en el servidor/DBA. | Descentralizado mediante consenso de nodos. |
| **Ejecución de Lógica** | Backend (Node.js/Python) + Procedimientos. | Smart Contract (Máquina Virtual de Ethereum - EVM). |
| **Tolerancia a Fallos** | Requiere replicación y backups (Punto único de fallo). | Alta disponibilidad nativa (Sistema distribuido puro). |
| **Auditoría** | Depende de logs internos manipulables por el Admin. | Criptográficamente verificable y pública (Inmutable). |

---

## 7. Instrucciones para la Configuración del Entorno Colaborativo

Para que cualquier desarrollador pueda integrarse en el proyecto TraDeck y desplegar su propia instancia local, debe seguir este protocolo estricto:

### 7.1. Prerrequisitos del Sistema
* **Node.js:** Versión `v22.10.0` (LTS) o superior (Requisito estricto de Hardhat v3).
* **Gestor de Paquetes:** `npm`.

### 7.2. Secuencia de Arranque
1.  Clonar el repositorio y acceder al directorio: `git clone <repo-url> && cd TraDeck`
2.  Instalar dependencias del proyecto: `npm install`
3.  Configurar variables de entorno: Crear un archivo `.env` en el directorio raíz. **Precaución:** Este archivo nunca debe subirse al control de versiones.
    ```env
    SEPOLIA_RPC_URL="<URL_NODO_RPC>"
    PRIVATE_KEY="<CLAVE_PRIVADA_WALLET>"
    ```
4.  Verificar la compilación de los Smart Contracts: `npx hardhat compile`
5.  Ejecutar la suite de pruebas unitarias locales: `npx hardhat test`