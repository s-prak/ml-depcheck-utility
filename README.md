# ml-depcheck-utility

This utility provides a script to scan the dependencies and transitive dependencies of a Node.js repository and identify any deprecated packages. It checks both the root-level dependencies and all nested dependencies for deprecation status and provides a detailed report and a configurable interface.

## Features

- **Root-Level Dependency Check:** Verifies the status of dependencies directly listed in the package.json file.

- **Transitive Dependency Check:** Recursively checks all nested dependencies for deprecation.

- **CLI Integration:** Easily run the utility from the command line.

- **Configurable Mode:** Choose between warning or error modes using configuration or environment variables.

- **Reason:** Each deprecated dependency includes a reason, often suggesting alternative packages.

## Usage

You can run the utility directly from the command line once it is installed.<br>
`check-deprecations`

## Changing the Configuration Mode

You can change the mode in two ways:

1. **Via the config/default.json file:**
   The default configuration can be modified by updating the mode setting in the config/default.json file. It supports two modes:
   - **warning:** Will log deprecated dependencies as warnings (default behavior).
   - **error:** Will log deprecated dependencies as errors and exit the process with a non-zero exit code.
2. **Via Environment Variable:**
   You can override the configuration by setting the MODE environment variable before running the utility. The commands are as follows:
   - `MODE=warning check-deprecations`
   - `MODE=error check-deprecations`

## Example Output

**Mode: warning**

```
Checking dependencies at root level...
1. @example/package1
   Reason:

WARNING!! Deprecated results found at root level.

Checking all transitive dependencies...
1. @example/package2
   Reason:

WARNING!! Deprecated results found in dependencies.
```

**Mode: error**

```
Checking dependencies at root level...
1. @example/package1
   Reason:

ERROR!! Deprecated results found at root level.

Checking all transitive dependencies...
1. @example/package2
   Reason:

ERROR!! Deprecated results found in dependencies.
```

**Success Case:**

```
Checking dependencies at root level...
SUCCESS: No deprecated packages found at root level! Congos!!

Checking all transitive dependencies...
SUCCESS: No deprecated packages found! Congos!!
```
