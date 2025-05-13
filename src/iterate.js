const fs     = require('fs');
const path   = require('path');
const fetch  = require('node-fetch').default;
const pLimit = require('p-limit').default;

// 1. Paths & concurrency limiter
const INPUT_PATH  = path.join(__dirname, '../data/sbom-aggregate.json');
const OUTPUT_PATH = path.join(__dirname, '../data/sbom-aggregate-with-timestamps.json');
const limit       = pLimit(10);

// 2. Load the existing SBOM aggregate
let sbom;
try {
  sbom = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
} catch (err) {
  console.error('❌ Failed to read or parse sbom-aggregate.json:', err);
  process.exit(1);
}

// 3. Prepare fetch‑tasks
const tasks = [];
for (const [dependency, versions] of Object.entries(sbom)) {
  for (const version of Object.keys(versions)) {
    tasks.push(limit(async () => {
      try {
        const res  = await fetch(`https://registry.npmjs.org/${encodeURIComponent(dependency)}`);
        const meta = await res.json();
        const ts   = meta.time?.[version] ?? null;
        sbom[dependency][version].publish_timestamp = ts;
        console.log(`✅ ${dependency}@${version} → ${ts}`);
      } catch (err) {
        console.error(`⚠️ Failed ${dependency}@${version}:`, err.message);
        sbom[dependency][version].publish_timestamp = null;
      }
    }));
  }
}

// 4. Run all tasks, then write file
Promise.all(tasks)
  .then(() => {
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sbom, null, 2), 'utf8');
    console.log(`\n🎉 All done. Written enriched SBOM to ${OUTPUT_PATH}`);
  })
  .catch(err => {
    console.error('❌ Unexpected error during fetches:', err);
  });
