export function DocumentacionPage(): JSX.Element {
  return (
    <section className="page-grid">
      <article className="surface-panel wide-panel docs-hero">
        <h2>Documentacion de uso</h2>
        <p>
          TraDeck es una dApp (aplicación descentralizada) para tokenizar cartas TCG (Trading Card Games) como NFT, venderlas con escrow y realizar intercambios
          atómicos.
        </p>
        <p>
          Redes soportadas en esta version: Hardhat Local (31337) y Sepolia (11155111).
        </p>
      </article>

      <article className="surface-panel docs-block">
        <h3>Inicio rapido con MetaMask</h3>
        <ol className="docs-list-numbered">
          <li>Instala MetaMask en tu navegador.</li>
          <li>Crea una cuenta o importa una existente.</li>
          <li>Selecciona la red Sepolia en el selector de TraDeck.</li>
          <li>Si no tienes Sepolia en MetaMask, TraDeck intentara agregarla automaticamente.</li>
          <li>Consigue ETH de prueba en un faucet de Sepolia para pagar gas.</li>
          <li>Conecta wallet y empieza a operar.</li>
        </ol>
      </article>

      <article className="surface-panel docs-block">
        <h3>Flujos principales</h3>
        <ol className="docs-list-numbered">
          <li>Crear carta: sube metadata a IPFS y ejecuta mint.</li>
          <li>Listar carta: define precio TDC y pasa a mercado.</li>
          <li>Comprar carta: el pago queda en escrow.</li>
          <li>Confirmar entrega: libera pago al vendedor y NFT al comprador.</li>
          <li>Swap: propone intercambio por otra carta y ejecuta cuando se acepta.</li>
        </ol>
      </article>

      <article className="surface-panel docs-block">
        <h3>Troubleshooting rapido</h3>
        <ul className="list-clean">
          <li>
            <strong>Red incorrecta:</strong> cambia la red objetivo y acepta el cambio en MetaMask.
          </li>
          <li>
            <strong>Error de IPFS/Pinata:</strong> revisa que el proxy este levantado y que CORS permita tu origen.
          </li>
          <li>
            <strong>Tx rechazada:</strong> confirma que tienes ETH de prueba para gas y vuelve a intentar.
          </li>
          <li>
            <strong>No aparecen cartas:</strong> verifica contratos y deploy block en el archivo frontend/.env.
          </li>
        </ul>
      </article>

      <article className="surface-panel docs-block">
        <h3>FAQ corta</h3>
        <div className="docs-faq">
          <details>
            <summary>Necesito crear cuenta en TraDeck?</summary>
            <p>No. Tu identidad es tu wallet de MetaMask.</p>
          </details>
          <details>
            <summary>Necesito dinero real para usar Sepolia?</summary>
            <p>
              No. En Sepolia se usa ETH de prueba. Para operar en TraDeck tambien puedes pedir airdrop de TDC
              dentro de la app.
            </p>
          </details>
          <details>
            <summary>Que pasa si no confirmo entrega en una compra?</summary>
            <p>
              La operacion queda en escrow. El contrato actual no tiene timeout automatico para liberar esa compra.
            </p>
          </details>
        </div>
      </article>

      <article className="surface-panel docs-block">
        <h3>Configurar Sepolia (primer acceso)</h3>
        <p>
          Antes de operar en Sepolia, debes desplegar los contratos en esa red y sincronizar direcciones al frontend:
        </p>
        <ol className="docs-list-numbered">
          <li>Abre una terminal en la carpeta <code>backend/</code>.</li>
          <li>Configura <code>.env</code> con tu <code>SEPOLIA_RPC_URL</code> y <code>PRIVATE_KEY</code>.</li>
          <li>Ejecuta: <code>npm run deploy:sepolia:sync</code></li>
          <li>Espera a que termine. Las direcciones se copian a <code>frontend/.env</code> automaticamente.</li>
          <li>Recarga esta pagina y vuelve a intentar.</li>
        </ol>
      </article>

      <article className="surface-panel wide-panel docs-block">
        <h3>Autores y licencia</h3>
        <p>
          Proyecto bajo licencia MIT (libre), segun el archivo LICENSE del repositorio.
        </p>
        <p>
          Autor 1: <a href="https://github.com/rafseggom" target="_blank" rel="noreferrer">Rafa Segura</a>
        </p>
        <p>
          Autor 2: <a href="https://github.com/Javierluqueruiz" target="_blank" rel="noreferrer">Javier Luque</a>
        </p>
      </article>
    </section>
  );
}
