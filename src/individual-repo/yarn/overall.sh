#!/bin/bash

#Install xslt processor
sudo yum install xsltproc

#Install dependencies
npm install --ignore-scripts --legacy-peer-deps --force

#Generate SBOM
mkdir -p ./tmp/result-individual
npx cyclonedx-npm --ignore-npm-errors --output-format "XML" --output-file "./tmp/result-individual/SBOM.xml"

#Convert SBOM into csv fornat
xsltproc tmp/ml-depcheck-utility/src/individual-repo/yarn/components.xslt "./tmp/result-individual/SBOM.xml" > "./tmp/result-individual/SBOM.csv"

#Update packages to make it compatible with npm repositories 
node tmp/ml-depcheck-utility/src/individual-repo/yarn/update-packages.js

#Append fields to sbom - deprecated and last publish
node tmp/ml-depcheck-utility/src/individual-repo/yarn/append-fields.js

