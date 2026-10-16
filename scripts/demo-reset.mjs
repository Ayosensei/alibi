// scripts/demo-reset.mjs
// Resets the demo player state in FalkorDB to a known initial state
import { FalkorDB } from 'falkordb';

async function main() {
  const url = process.env.FALKORDB_URL ?? 'redis://localhost:6379';
  const db = await FalkorDB.connect({ url });

  const graphs = await db.list();
  const demoGraphs = graphs.filter(
    (g) => g.startsWith('play:demo:') || g === 'player:demo'
  );

  for (const g of demoGraphs) {
    try {
      const graph = db.selectGraph(g);
      await graph.delete();
      console.log(`Deleted ${g}`);
    } catch (err) {
      console.warn(`Could not delete ${g}: ${err.message}`);
    }
  }

  await db.close();
  console.log('Demo player reset: graphs cleared.');
}

main().catch((err) => {
  console.error('demo:reset failed:', err);
  process.exit(1);
});
