#!/bin/bash

# Get the absolute path to the directory where this script is
SCRIPT_DIR="$(cd "$(dirname "$(realpath "$0")")" && pwd)"

# Run your actual script from your package directory
bash "$SCRIPT_DIR/../src/aggregate/generate-sbom.sh" "$@"