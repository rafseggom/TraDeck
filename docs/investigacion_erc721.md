## 1. ¿Qué es el Estándar ERC-721?
Según la documentación oficial de OpenZeppelin, el ERC-721 es el estándar para representar la propiedad de tokens no fungibles (NFTs), donde cada token es único e indivisible. En nuestra arquitectura, el NFT actúa como la clave primaria y el certificado de propiedad irrefutable de cada carta coleccionable.

## 2. El "Diccionario de Datos" en Solidity

A diferencia de los SGBD tradicionales que usan tablas relacionales y claves foráneas, el ERC-721 asocia la propiedad mediante diccionarios de datos nativos de la blockchain (`mapping`).

A través de funciones estándar como `ownerOf(tokenId)`, el contrato inteligente actúa como nuestro motor de base de datos, permitiéndonos consultar que dirección criptográfica (usuario) posee un ID de carta especfíco de forma instantánea y segura.

## 3. Estrategia de Almacenamiento y Costes
Almacenar grandes cantidades de datos en la blockchain, como imágenes de alta calidad, tiene un coste de transacción alto y prohibitivo. La propia documentación de OpenZeppelin advierte sobre esto y sugiere el uso de sistemas como IFPS.

Por ello, aplicamos una división de datos:

### Datos On-Chain (Base de Datos de Estado)
Solo se persisten en la blockchain los datos cosiderados críticos que garantizan la titularidad:
* **`tokenId`**: El identificador único de la carta.
* **`ownder`**: La dirección criptográfica del dueño.
* **`tokenURI`**: Un puntero o enlace a la alojamiento externo.

### Datos Of-Chain (Metadatos en IPDFS)

El `tokenURI` se diseña para que resuelva a un documento JSON alojado en la red descentralizada IPFS. Este archivo contiene los datos pesados de la carta:

```json
{
    "name": "Charizard",
    "description": "Carta holográfica primera edición",
    "image": "ipfs://<CID-de-la-imagen>"
}
