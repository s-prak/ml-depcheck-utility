const pacote = require('pacote')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

const configPath = path.resolve(__dirname, '../config/default.json')
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))

const mode = process.env.MODE || config.mode

const BLUE = '\x1b[34m'
const RESET = '\x1b[0m'
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'

function normalize (pkgWithTag) {
  if (!pkgWithTag || typeof pkgWithTag !== 'string') return null

  if (
    pkgWithTag.startsWith('workspace:') ||
    pkgWithTag.startsWith('patch:') ||
    pkgWithTag.startsWith('link:')
  ) {
    return null
  }

  const virtualMatch = pkgWithTag.match(/^((@[^@/]+\/[^@/]+|[^@/]+)?)@virtual:.*#npm:([\dA-Za-z.+-]+):?$/)
  if (virtualMatch) {
    return `${virtualMatch[1]}@${virtualMatch[3]}`
  }

  const npmMatch = pkgWithTag.match(/^((@[^@/]+\/[^@/]+|[^@/]+)?)@npm:([\dA-Za-z.+-]+)$/)
  if (npmMatch) {
    return `${npmMatch[1]}@${npmMatch[3]}`
  }

  if (/^(@?[^@/]+\/?[^@/]*)@[\dA-Za-z.+-]+$/.test(pkgWithTag)) {
    return pkgWithTag
  }

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

function getDirectDepNames () {
  const pkgPath = path.resolve(process.cwd(), 'package.json')
  const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  const allDeps = Object.assign({}, pkgJson.dependencies || {}, pkgJson.devDependencies || {})
  return Object.keys(allDeps)
}

function checkDependencies () {
  // 1. Get the direct dependency names (no versions) from package.json
  const directDepNames = new Set(getDirectDepNames())

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

      const directDeps = new Set()
      const transitiveDeps = new Set()
      const allDepsSeen = new Set()

      for (const entry of parsedLines) {
        // Get the package name and version from entry.value (string or object)
        let pkg = null
        if (entry.value && typeof entry.value === 'string') {
          pkg = normalize(entry.value)
        } else if (entry.value && typeof entry.value === 'object' && entry.value.value) {
          pkg = normalize(entry.value.value)
        }

        if (pkg) {
          const nameOnly = pkg.replace(/@[\dA-Za-z.+-]+$/, '')
          if (directDepNames.has(nameOnly)) {
            directDeps.add(pkg)
          } else {
            transitiveDeps.add(pkg)
          }
          allDepsSeen.add(pkg)
        }

        // Add children dependencies (transitive)
        if (entry.value && typeof entry.value === 'object' && entry.value.children?.Dependencies) {
          entry.value.children.Dependencies.forEach(dep => {
            const depPkg = normalize(dep.locator)
            if (depPkg && !allDepsSeen.has(depPkg)) {
              const depNameOnly = depPkg.replace(/@[\dA-Za-z.+-]+$/, '')
              if (directDepNames.has(depNameOnly)) {
                directDeps.add(depPkg)
              } else {
                transitiveDeps.add(depPkg)
              }
              allDepsSeen.add(depPkg)
            }
          })
        }
      }

      // Remove any direct dependencies from transitiveDeps (just in case)
      directDeps.forEach(dep => transitiveDeps.delete(dep))

      const directArray = Array.from(directDeps)
      const transitiveArray = Array.from(transitiveDeps)

      console.log(`${BLUE}Checking ${directArray.length} direct dependencies and ${transitiveArray.length} transitive dependencies for deprecation...${RESET}`)

      const [directResults, transitiveResults] = await Promise.all([
        Promise.all(directArray.map(pkg => checkDeprecated(pkg))),
        Promise.all(transitiveArray.map(pkg => checkDeprecated(pkg)))
      ])

      const deprecatedDirect = directResults.filter(Boolean)
      const deprecatedTransitive = transitiveResults.filter(Boolean)

      let foundAny = false

      // Print direct deprecations
      if (deprecatedDirect.length) {
        foundAny = true
        const color = mode === 'error' ? YELLOW : RED
        console.log(`${color}\nFound ${deprecatedDirect.length} deprecated direct dependencies:\n${RESET}`)
        deprecatedDirect.forEach((r, i) => console.log(`${i + 1}. ${r}`))
      } else {
        console.log(`${GREEN}\n✅ No deprecated direct dependencies found!\n${RESET}`)
      }

      // Print transitive deprecations
      if (deprecatedTransitive.length) {
        foundAny = true
        const color = mode === 'error' ? YELLOW : RED
        console.log(`${color}\nFound ${deprecatedTransitive.length} deprecated transitive dependencies:\n${RESET}`)
        deprecatedTransitive.forEach((r, i) => console.log(`${i + 1}. ${r}`))
      } else {
        console.log(`${GREEN}\n✅ No deprecated transitive dependencies found!\n${RESET}`)
      }

      if (foundAny && mode === 'error') {
        process.exit(1)
      }
    } catch (e) {
      console.error(`❌ Failed to parse or analyze output:\n${e.message}`)
    }
  })
}

module.exports = {
  checkDependencies
}
