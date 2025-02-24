/*
 License
 --------------
 Copyright © 2020-2024 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Mojaloop Foundation
 - Sam Kummary <skummary@mojaloop.io>
 - Shuchita Prakash <sprakash_cse210557@mgit.ac.in>
 ------------
*/

const fs = require('fs')
const pacote = require('pacote')
const path = require('path')

const configPath = path.resolve(__dirname, '../config/default.json')
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))

const mode = process.env.MODE || config.mode

const packageLockJson = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'))

const processedPackages = new Set()
let rootPackages = {}
let rootDevPackages = {}

const BLUE = '\x1b[34m'
const RESET = '\x1b[0m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const GREEN = '\x1b[32m'

let totalDeprecatedCount = 0

// Checks if a given package is deprecated by fetching its manifest using pacote
async function checkDeprecated (pkg) {
  try {
    const manifest = await pacote.manifest(pkg)
    if (manifest.deprecated) {
      return `${pkg} \n${manifest.deprecated}\n\n`
    }
  } catch (err) {
    return `Error checking ${pkg}: ${err.message}\nPlease update to the latest version.\n\n`
  }
  return null
}

// Processes a given set of dependencies (either root-level or transitive)
// Differentiates between functional and dev dependencies and checks for deprecation.
async function processDependencies (dependencies, root = false, dev = false) {
  if (!dependencies) return

  let results = [] // Collect results for each section

  if (!root) {
    const transitiveFunctionalDependencies = []
    const transitiveDevDependencies = []

    for (const packageName of Object.keys(dependencies)) {

      if(packageName === "") continue;
      const name = packageName.split('node_modules/').pop()
      const packageInfo = dependencies[packageName]
      const version = packageInfo.version
      const pkg = `${name}@${version}`

      if (!processedPackages.has(pkg)) {
        processedPackages.add(pkg)
        if (packageInfo.dev) {
          transitiveDevDependencies.push(pkg)
        } else {
          transitiveFunctionalDependencies.push(pkg)
        }
      }
    }

    console.log(`${BLUE}\nChecking transitive functional dependencies...${RESET}`)
    results = await Promise.all(transitiveFunctionalDependencies.map(pkg => checkDeprecated(pkg)))
    results = results.filter(Boolean)
    if (results.length) {
      totalDeprecatedCount += results.length
      console.log(results.map((r, i) => `${i + 1}. ${r}`).join(''))
    }

    console.log(`${BLUE}\nChecking transitive dev dependencies...${RESET}`)
    results = await Promise.all(transitiveDevDependencies.map(pkg => checkDeprecated(pkg)))
    results = results.filter(Boolean)
    if (results.length) {
      totalDeprecatedCount += results.length
      console.log(results.map((r, i) => `${i + 1}. ${r}`).join(''))
    }
  } else {
    console.log(dev ? `${BLUE}\nChecking root dev dependencies...${RESET}` : `${BLUE}\nChecking root functional dependencies...${RESET}`)

    results = await Promise.all(
      Object.entries(dependencies).map(([name, version]) => checkDeprecated(`${name}@${version}`))
    )
    results = results.filter(Boolean)
    if (results.length) {
      totalDeprecatedCount += results.length
      console.log(results.map((r, i) => `${i + 1}. ${r}`).join(''))
    }
  }
}

// Main function to check all dependencies, logs the output
async function checkDependencies () {
  console.log(`${BLUE}\nStarting dependency check...${RESET}`)

  rootPackages = packageLockJson.packages[''].dependencies || {}
  rootDevPackages = packageLockJson.packages[''].devDependencies || {}

  await processDependencies(rootPackages, true, false)
  await processDependencies(rootDevPackages, true, true)

  const packages = packageLockJson.packages
  await processDependencies(packages, false)

  if (mode === 'error' && totalDeprecatedCount > 1) {
    console.error(`${RED}\nERROR!! Found ${totalDeprecatedCount} deprecated dependencies.\n${RESET}`)
    process.exit(1)
  } else if (mode === 'warning' && totalDeprecatedCount > 1) {
    console.log(`${YELLOW}\nWARNING!! Found ${totalDeprecatedCount} deprecated dependencies.\n${RESET}`)
  } else if (totalDeprecatedCount === 0) {
    console.log(`${GREEN}\nCONGOS!!! No deprecated dependencies are found!\n${RESET}`)
  }
}

module.exports = {
  checkDependencies
}
