const { connectDB } = require('../config/db');
const models = require('../models');

async function checkIndexes() {
  const { connected, error } = await connectDB();
  if (!connected) {
    console.error(`[indexes] aborted: ${error}`);
    process.exit(1);
  }

  try {
    for (const [name, model] of Object.entries(models)) {
      if (typeof model !== 'function' || !model.collection) continue;
      const indexes = await model.collection.indexInformation({ full: true });
      console.log(`\n=== ${name} (${indexes.length} indexes) ===`);
      for (const idx of indexes) {
        console.log(`  ${idx.name}: ${JSON.stringify(idx.key)}${idx.partialFilterExpression ? ` partial=${JSON.stringify(idx.partialFilterExpression)}` : ''}`);
      }
    }
  } finally {
    await require('mongoose').disconnect();
    console.log('\n[indexes] disconnected');
  }
}

checkIndexes().catch((err) => {
  console.error('[indexes] failed:', err.message);
  process.exit(1);
});
