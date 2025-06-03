const pacote = require('pacote')
const { exec } = require('child_process')

const BLUE = '\x1b[34m'
const RESET = '\x1b[0m'
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'

let totalDeprecatedCount = 0

// Normalize yarn locator to pacote-compatible package@version
function normalize (pkgWithTag) {
  if (!pkgWithTag || typeof pkgWithTag !== 'string') return null

  // Ignore unsupported protocols
  if (
    pkgWithTag.startsWith('workspace:') ||
    pkgWithTag.startsWith('patch:') ||
    pkgWithTag.startsWith('link:')
  ) {
    return null // skip these
  }

  // virtual:...#npm:version (allow prerelease/build in version)
  const virtualMatch = pkgWithTag.match(/^((@[^@/]+\/[^@/]+|[^@/]+)?)@virtual:.*#npm:([\dA-Za-z.+-]+):?$/)

  if (virtualMatch) {
    return `${virtualMatch[1]}@${virtualMatch[3]}`
  }

  // npm:... with version possibly including prerelease tags or build metadata
  const npmMatch = pkgWithTag.match(/^((@[^@/]+\/[^@/]+|[^@/]+)?)@npm:([\dA-Za-z.+-]+)$/)
  if (npmMatch) {
    return `${npmMatch[1]}@${npmMatch[3]}`
  }

  // If it's already a normal pkg@version format (e.g. lodash@4.17.21), return as is
  if (/^(@?[^@/]+\/?[^@/]*)@[\dA-Za-z.+-]+$/.test(pkgWithTag)) {
    return pkgWithTag
  }

  // Unknown format, skip
  return null
}

// Check if a package is deprecated
async function checkDeprecated (pkg) {
  try {
    const manifest = await pacote.manifest(pkg)
    if (manifest.deprecated) {
      return `${pkg}\n${manifest.deprecated}\n`
    }
  } catch (err) {
    console.warn(`⚠️ Failed to fetch manifest for ${pkg}: ${err.message}`)
  }
  return null
}

// Main function
function checkDependencies () {
  console.log(`${BLUE}Running "yarn info --json -R"...${RESET}`)

  exec('yarn info --json -R', async (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error: ${error.message}`)
      return
    }

    if (stderr) {
      console.error(`⚠️ Warning: ${stderr}`)
    }

    try {
      const lines = stdout.trim().split('\n')
      const parsedLines = lines.map(line => JSON.parse(line))

      const locatorMap = new Set()

      parsedLines.forEach(entry => {
        const value = entry.value
        if (value && typeof value === 'string') {
          const norm = normalize(value)
          if (norm) locatorMap.add(norm)
        } else if (value && typeof value === 'object') {
          if (value.value) {
            const norm = normalize(value.value)
            if (norm) locatorMap.add(norm)
          }
          if (value.children?.Dependencies) {
            value.children.Dependencies.forEach(dep => {
              const norm = normalize(dep.locator)
              if (norm) locatorMap.add(norm)
            })
          }
        }
      })

      // Filter out any null or invalid package strings before check
      const filteredPkgs = [...locatorMap].filter(pkg => {
        if (!pkg) {
          console.warn(`${YELLOW}Skipping invalid package string: ${pkg}${RESET}`)
          return false
        }
        return true
      })

      console.log(`${BLUE}Checking ${filteredPkgs.length} dependencies for deprecation...${RESET}`)

      const results = await Promise.all(filteredPkgs.map(pkg => checkDeprecated(pkg)))
      const deprecated = results.filter(Boolean)

      if (deprecated.length) {
        totalDeprecatedCount = deprecated.length
        console.log(`${RED}\nFound ${totalDeprecatedCount} deprecated dependencies:\n${RESET}`)
        deprecated.forEach((r, i) => console.log(`${i + 1}. ${r}`))
      } else {
        console.log(`${GREEN}\n✅ No deprecated dependencies found!\n${RESET}`)
      }
    } catch (e) {
      console.error(`❌ Failed to parse or analyze output:\n${e.message}`)
    }
  })
}

module.exports = {
  checkDependencies
}
