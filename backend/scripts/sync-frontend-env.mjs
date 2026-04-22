import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NETWORKS = {
  local: {
    chainId: 31337,
    envPrefix: "LOCAL",
  },
  sepolia: {
    chainId: 11155111,
    envPrefix: "SEPOLIA",
  },
};

function readArg(name) {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);

  if (index < 0 || index + 1 >= process.argv.length) {
    return null;
  }

  return process.argv[index + 1];
}

function parseDeployBlockFromJournal(journalPath) {
  if (!fs.existsSync(journalPath)) {
    return 0;
  }

  const raw = fs.readFileSync(journalPath, "utf8");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);

  let maxBlock = 0;

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      const blockNumber = Number(entry?.receipt?.blockNumber ?? 0);
      if (Number.isFinite(blockNumber) && blockNumber > maxBlock) {
        maxBlock = blockNumber;
      }
    } catch {
      // Ignore malformed lines to keep the script resilient.
    }
  }

  return maxBlock;
}

function upsertEnv(content, key, value) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedKey}=.*$`, "m");
  const line = `${key}=${value}`;

  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  const needsNewline = content.length > 0 && !content.endsWith("\n");
  return `${content}${needsNewline ? "\n" : ""}${line}\n`;
}

function ensureFrontendEnv(frontendEnvPath, frontendEnvExamplePath) {
  if (fs.existsSync(frontendEnvPath)) {
    return;
  }

  if (!fs.existsSync(frontendEnvExamplePath)) {
    fs.writeFileSync(frontendEnvPath, "", "utf8");
    return;
  }

  const example = fs.readFileSync(frontendEnvExamplePath, "utf8");
  fs.writeFileSync(frontendEnvPath, example, "utf8");
}

function main() {
  const networkKey = readArg("network");

  if (!networkKey || !Object.prototype.hasOwnProperty.call(NETWORKS, networkKey)) {
    console.error("Uso: node scripts/sync-frontend-env.mjs --network <local|sepolia>");
    process.exit(1);
  }

  const config = NETWORKS[networkKey];
  const deploymentDir = path.resolve(__dirname, `../ignition/deployments/chain-${config.chainId}`);
  const addressesPath = path.join(deploymentDir, "deployed_addresses.json");
  const journalPath = path.join(deploymentDir, "journal.jsonl");

  if (!fs.existsSync(addressesPath)) {
    console.error(`No existe el archivo de despliegue: ${addressesPath}`);
    console.error("Ejecuta primero el despliegue de Ignition para esa red.");
    process.exit(1);
  }

  const deployed = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const coinAddress = deployed["TraDeckModule#TraDeckCoin"];
  const nftAddress = deployed["TraDeckModule#TraDeckNFT"];

  if (!coinAddress || !nftAddress) {
    console.error("No se encontraron las direcciones esperadas para TraDeckCoin y TraDeckNFT.");
    process.exit(1);
  }

  const deployBlock = parseDeployBlockFromJournal(journalPath);

  const frontendEnvPath = path.resolve(__dirname, "../../frontend/.env");
  const frontendEnvExamplePath = path.resolve(__dirname, "../../frontend/.env.example");

  ensureFrontendEnv(frontendEnvPath, frontendEnvExamplePath);

  let envContent = fs.readFileSync(frontendEnvPath, "utf8");

  envContent = upsertEnv(envContent, `VITE_${config.envPrefix}_TRADECK_COIN`, coinAddress);
  envContent = upsertEnv(envContent, `VITE_${config.envPrefix}_TRADECK_NFT`, nftAddress);

  if (deployBlock > 0) {
    envContent = upsertEnv(envContent, `VITE_${config.envPrefix}_DEPLOY_BLOCK`, String(deployBlock));
  }

  fs.writeFileSync(frontendEnvPath, envContent, "utf8");

  console.log(`[sync-frontend-env] Red: ${networkKey}`);
  console.log(`[sync-frontend-env] Coin: ${coinAddress}`);
  console.log(`[sync-frontend-env] NFT: ${nftAddress}`);
  if (deployBlock > 0) {
    console.log(`[sync-frontend-env] Deploy block: ${deployBlock}`);
  } else {
    console.log("[sync-frontend-env] Deploy block no detectado en journal.jsonl");
  }
  console.log(`[sync-frontend-env] Archivo actualizado: ${frontendEnvPath}`);
}

main();
