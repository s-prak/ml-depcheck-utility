// const fs = require('fs');
// const path = require('path');

// // directory where the dependencies csv for each repo is located 
// const directoryPath = "./data/sbom-csv";
// //Create a new Map datastructure to link dependencies to Mojaloop servies 
// const map = new Map();

// //Read files in specified repository 
// fs.readdirSync(directoryPath).forEach((file) => {
//     const filePath = path.join(directoryPath, file);
//     try {
//         // Read files synchronously 
//         const data = fs.readFileSync(filePath, 'utf8'); 
//         const lines = data.split('\n');
//         lines.forEach((line) => {
//             //console.log(line); 

//             //Fetch repo name from file name 
//             const s=file.split('.')[0];
//             const service=s.substring(s,s.length-5)
            
//             const dependency=line.split(",")[1];
//             console.log(dependency);
//             //Add the dependencies and corresponding services to the map 
//             if(dependency){
//                 if (map.has(dependency)) {
//                     map.get(dependency).add(service);
//                 } else {
//                     map.set(dependency, new Set([service]));
//                 }
//             }
//         });
//     } catch (err) {
//         console.log("Unable to read:", err);
//     }
// });

// //Delete the dependency field to avoid the header to become a field 
// map.delete('dependency')

// //Create an array from the map to sort the map 
// let mapArray = Array.from(map);

// // Sort the array by keys lexically
// mapArray.sort((a, b) => {
//     if (a[0] < b[0]) {
//         return -1;
//     }
//     if (a[0] > b[0]) {
//         return 1;
//     }
//     return 0;
// });

// // Create a new sorted map from the sorted array
// let sortedMap = new Map(mapArray);

// // Create a new map, finalMap to link dependencies-versions-services
// const finalMap=new Map();



// sortedMap.forEach((value,key)=>{

//     //identify version and dependency 
//     let parts=key.split("@");
//     let version=parts.pop();
//     let depend =parts.join("@");
    
//     //Populate finalMap
//     if (finalMap.has(depend)) {
//         finalMap.get(depend).set(version,value);
//     } else {
//         finalMap.set(depend, new Map());
//         finalMap.get(depend).set(version,value)
//     }
// });

// console.log(finalMap);

// // Create csv
// let csvContent = '';
// csvContent+="dependency,version,services\n";
// finalMap.forEach((values, dep) => {
//     // Add the line as the first value
//     if(!dep) return;
//     csvContent += `${dep}`;
//     // Add each file name as subsequent lines
//     values.forEach((services,version) => {
//         csvContent += `,${version}`;
//         let count=0;
//         services.forEach((service) => {
//             if(count==0){
//                 csvContent += `,${service}\n`;
//             }
//             else{
//                 csvContent +=`,,${service}\n`;
//             }
//             count++;
//         })
//     });
// });

// //Define path to save csv 
// const csvFilePath = "./data/dependency-services2.csv";
// fs.writeFileSync(csvFilePath, csvContent, 'utf8');

// // Convert finalMap (Map<dependency, Map<version, Set<services>>>) to plain object
// const jsonObject = {};
// finalMap.delete("");

// finalMap.forEach((versionMap, dependency) => {
//     jsonObject[dependency] = {};

//     versionMap.forEach((servicesSet, version) => {
//         jsonObject[dependency][version] = Array.from(servicesSet); // Convert Set to Array
//     });
// });

// // Define path to save JSON
// const jsonFilePath = "./data/dependency-services2.json";

// // Write to JSON file
// fs.writeFileSync(jsonFilePath, JSON.stringify(jsonObject, null, 2), 'utf8');
// console.log(`✅ Saved dependency-services mapping to ${jsonFilePath}`);


const fs = require('fs');
const path = require('path');

// Directory containing SBOM CSVs
const directoryPath = "./data/sbom-csv";

// Map to hold the data
// Structure: Map<dependency, { type, group, author, name, email, versions: Map<version, { services: Set, licenseId, timestamp }> }>
const map = new Map();

fs.readdirSync(directoryPath).forEach((file) => {
    const filePath = path.join(directoryPath, file);

    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split('\n');

        lines.forEach((line) => {
            const fields = line.split(",");

            if (fields.length < 24) return; // Ensure line has all fields

            const dependency = fields[1];
            if (!dependency || dependency === 'dependency') return; // Skip empty lines or headers

            const type = fields[0];
            const licenseId = fields[2];
            const group = fields[3];
            const author = fields[4];
            const name = fields[5];
            const email = fields[20];
            const timestamp = fields[23];

            const repoName = file.split('.')[0];
            const service = repoName.substring(0, repoName.length - 5);

            const versionParts = dependency.split("@");
            const version = versionParts.pop();
            const depName = versionParts.join("@");

            if (!map.has(depName)) {
                map.set(depName, {
                    type,
                    group,
                    author,
                    name,
                    email,
                    versions: new Map()
                });
            }

            const depEntry = map.get(depName);

            if (!depEntry.versions.has(version)) {
                depEntry.versions.set(version, {
                    services: new Set(),
                    licenseId,
                    timestamp
                });
            }

            depEntry.versions.get(version).services.add(service);
        });

    } catch (err) {
        console.error(`Unable to read file ${file}:`, err);
    }
});

// === Create CSV ===
let csvContent = 'dependency,version,type,group,author,name,email,licenseId,timestamp,services\n';

map.delete("");

map.forEach((depEntry, dep) => {
    depEntry.versions.forEach((verEntry, version) => {
        let first = true;
        verEntry.services.forEach(service => {
            csvContent += first
                ? `${dep},${version},${depEntry.type},${depEntry.group},${depEntry.author},${depEntry.name},${depEntry.email},${verEntry.licenseId},${verEntry.timestamp},${service}\n`
                : `,,,,,,,,,${service}\n`;
            first = false;
        });
    });
});

const csvFilePath = "./data/sbom.csv";
fs.writeFileSync(csvFilePath, csvContent, 'utf8');
console.log(`✅ Saved CSV to ${csvFilePath}`);


