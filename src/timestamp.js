const fs = require('fs');
const fetch = require('node-fetch'); // <-- Add this line

const data = JSON.parse(fs.readFileSync('../data/sbom-aggregate.json', 'utf8'));

async function addTimestamps() {
  for (const [pkg, versions] of Object.entries(data)) {
    const encodedPkg = encodeURIComponent(pkg);
    try {
      const response = await fetch(`https://registry.npmjs.org/${encodedPkg}`);
      if (!response.ok) {
        console.error(`❌ Failed to fetch ${pkg}: ${response.statusText}`);
        continue;
      }
      const metadata = await response.json();
      const timeData = metadata.time || {};
      for (const [version, details] of Object.entries(versions)) {
        details.publish_timestamp = timeData[version] || null;
      }
    } catch (err) {
      console.error(`⚠️ Error fetching ${pkg}:`, err.message);
    }
  }

  fs.writeFileSync('../data/sbom-aggregate-with-timestamps.json', JSON.stringify(data, null, 2));
  console.log("✅ Timestamps added to sbom-aggregate-with-timestamps.json");
}

addTimestamps();
