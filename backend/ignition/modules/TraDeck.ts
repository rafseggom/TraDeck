import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TraDeckModule", (m) => {
  // 1. Desplegamos el Banco Central (La Moneda)
  const coin = m.contract("TraDeckCoin");

  // 2. Desplegamos el Mercado pasándole el contrato de la Moneda como argumento
  const nft = m.contract("TraDeckNFT", [coin]);

  // Devolvemos ambos para que Ignition sepa qué ha desplegado
  return { coin, nft };
});