#!/bin/bash

json_file=$1  # The first argument passed to the script is the JSON file

# Detect this script's root (inside CLI package)
SCRIPT_DIR="$(cd "$(dirname "$(realpath "$0")")" && pwd)"

# Check if json_file is provided and the file exists
mkdir -p ./data
if [ -f "$json_file" ]; then
  echo "Copying $json_file to ./data/repos-list.json"
  cp "$json_file" ./data/repos-list.json
else
  echo "$json_file not found. Copying ./config/repos-list.json to ./data/repos-list.json"
  cp $SCRIPT_DIR/../../config/repos-list.json ./data/repos-list.json
fi

# Download the sboms for the repos 
mkdir -p ./data/sbom-csv
bash $SCRIPT_DIR/download-sboms.sh

# Make SBOM aggregate 
node $SCRIPT_DIR/map-dependencies.js

# Save the file 
mv ./data/sbom.csv sbom.csv
mv ./data/sbom-csv ./sbom-repo-wise
rm -rf ./data

[ -f sbom.csv ] && echo "🎉 Thank you! SBOM successfully generated and saved as sbom.csv" || echo "SBOM file not found. Please check for errors."