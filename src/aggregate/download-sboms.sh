#!/bin/bash

# Path to the JSON file
JSON_FILE="./data/repos-list.json"

# Target directory for downloaded SBOMs
TARGET_DIR="./data/sbom-csv"

# Read repos array from the JSON file using jq
REPOS=$(jq -r '.repos[]' "$JSON_FILE")

# Loop through each repo name
for REPO in $REPOS; do
  FILE_URL="https://raw.githubusercontent.com/mojaloop/$REPO/main/sbom.csv"
  OUTPUT_FILE="$TARGET_DIR/${REPO}-sbom.csv"

  echo "Downloading sbom.csv from $REPO..."

  # Download the sbom.csv file
  curl -s -f "$FILE_URL" -o "$OUTPUT_FILE"

  if [ $? -eq 0 ]; then
    echo "✔ Downloaded to $OUTPUT_FILE"
  else
    echo "⚠ Failed to download sbom.csv from $REPO"
    rm -f "$OUTPUT_FILE"  # Remove partial file if download failed
  fi
done

echo "All done."
