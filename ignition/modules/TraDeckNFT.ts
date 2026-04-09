import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

const TraDeckNFTModule = buildModule("TraDeckNFTModule", (m) => {
    const tradeck = m.contract("TraDeckNFT");

    return { tradeck };
});

export default TraDeckNFTModule;