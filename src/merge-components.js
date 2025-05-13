const fs = require('fs');
const path = require('path');

// 1. Read unique components from sbom-repo-wise directory
const componentDirectory = "../data/sbom-repo-wise";
const componentMap = new Map();

fs.readdirSync(componentDirectory).forEach((file) => {
    const filePath = path.join(componentDirectory, file);
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split('\n');

        lines.forEach((line) => {
            const parts = line.split(',');
            const dep = parts[1]; // brom_ref, e.g. lodash@4.17.21
            if (!dep || dep === 'brom_ref') return;
            if (!componentMap.has(dep)) {
                componentMap.set(dep, {
                    type: parts[0],
                    brom_ref: parts[1],
                    license_id: parts[2],
                    group: parts[3],
                    author: parts[4],
                    name: parts[5]
                });
            }
        });
    } catch (err) {
        console.error("Unable to read:", err);
    }
});

// 2. Read dependency-services.json
const dependencyServicesPath = "../data/dependency-services.json";
let dependencyMap;

try {
    const raw = fs.readFileSync(dependencyServicesPath, 'utf8');
    dependencyMap = JSON.parse(raw);
    delete dependencyMap[""];
} catch (err) {
    console.error("Failed to read dependency-services.json:", err);
    process.exit(1);
}

// 3. Merge component info into the dependency-service map
const finalJson = {};

Object.entries(dependencyMap).forEach(([dep, versionMap]) => {
    finalJson[dep] = {};
    Object.entries(versionMap).forEach(([version, servicesSet]) => {
        const key = `${dep}@${version}`;
        const componentInfo = componentMap.get(key) || {
            type: "",
            brom_ref: key,
            group: "",
            name: dep,
            license_id: "",
            version: version
        };

        finalJson[dep][version] = {
            ...componentInfo,
            services: Array.from(servicesSet)
        };
    });
});

// 4. Save to sbom-aggregate.json
const outputPath = "../data/sbom-aggregate.json";
fs.writeFileSync(outputPath, JSON.stringify(finalJson, null, 2), 'utf8');
console.log("✅ Saved merged data to sbom-aggregate.json");
