# ML-DEPCHECK-UTILITY

This project provides a script to scan the dependencies and transitive dependencies of a Node.js repository and identify any deprecated packages. It checks both the root-level dependencies and all nested dependencies for deprecation status and provides a detailed report.

## Features

**Root-Level Dependency Check:** Verifies the status of dependencies directly listed in the package.json file.

**Transitive Dependency Check:** Recursively checks all nested dependencies for deprecation.

## Example Output

**Root-Level Check:**

```
Checking dependencies at root level...
1. @example/package1 DEPRECATED

WARNING!! Deprecated results found at root level.
```

**Transitive Dependency Check:**

```
Checking all dependencies (including transitive)...
1. @example/package2 DEPRECATED

WARNING!! Deprecated results found in dependencies.
```

**Success Case:**

```
Checking dependencies at root level...
SUCCESS: No deprecated packages found at root level! Congos!!

Checking all dependencies (including transitive)...
SUCCESS: No deprecated packages found! Congos!!
```
