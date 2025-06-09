#!/bin/bash

#Install xslt processor
apk add --no-cache libxslt

# Get repo version from package.json
REPO_VERSION=$(node -p "require('./package.json').version")

# Detect this script's root (inside CLI package)
SCRIPT_DIR="$(cd "$(dirname "$(realpath "$0")")" && pwd)"

#Install dependencies
yarn set version stable
yarn install --mode=skip-build

#Make temporary directory
mkdir -p ./tmp

#Generate SBOM
mkdir -p ./tmp/result-individual
yarn dlx @cyclonedx/yarn-plugin-cyclonedx@3.0.3 --of XML -o "./tmp/result-individual/SBOM.xml"

#Convert SBOM into csv fornat
xsltproc $SCRIPT_DIR/components.xslt "./tmp/result-individual/SBOM.xml" > "./tmp/result-individual/SBOM.csv"

#Update packages to make it compatible with npm repositories 
node $SCRIPT_DIR/update-packages.js

#Append fields to sbom - deprecated and last publish
node $SCRIPT_DIR/append-fields.js

# Save the SBOM with version in the filename
FINAL_SBOM_NAME="sbom-yarn-v$REPO_VERSION.csv"
mv tmp/result-individual/SBOM-final.csv "$FINAL_SBOM_NAME"

#Delete files
rm -rf ./tmp

# Check if SBOM was saved
[ -f "$FINAL_SBOM_NAME" ] && echo "🎉 Thank you! SBOM successfully generated and saved as $FINAL_SBOM_NAME" || echo "SBOM file not found. Please check for errors."
