# ml-depcheck-utility

This utility provides a script to scan the dependencies and transitive dependencies of a Node.js repository and identify any deprecated packages. It checks both the root-level dependencies and all nested dependencies for deprecation status and provides a detailed report and a configurable interface.

## Features

- **Root-Level Dependency Check:** Verifies the status of dependencies directly listed in the package.json file.

- **Transitive Dependency Check:** Recursively checks all nested dependencies for deprecation.

- **Identifies Dev and Functional Dependencies:** Differentiates between development and functional dependencies.

- **CLI Integration:** Easily run the utility from the command line.

- **Configurable Mode:** Choose between warning or error modes using configuration or environment variables.

- **Reason:** Each deprecated dependency includes a reason, often suggesting alternative packages.

## Usage

You can run the utility directly from the command line once it is installed.<br>
`npm install @mojaloop/ml-depcheck-utility`<br>
`check-deprecations`<br>

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
Starting dependency check

Checking root functional dependencies...
1. @example/package1
   Reason:

Checking root dev dependencies...
1. @example/package2
   Reason:

Checking transitive functional dependecies...
1. @example/package3
   Reason:

Checking transitive dev dependecies...
1. @example/package4
   Reason:

WARNING!! Found 4 deprecated dependencies.
```

**Mode: error**

```
Starting dependency check

Checking root functional dependencies...
1. @example/package1
   Reason:

Checking root dev dependencies...
1. @example/package2
   Reason:

Checking transitive functional dependecies...
1. @example/package3
   Reason:

Checking transitive dev dependecies...
1. @example/package4
   Reason:

Error!! Found 4 deprecated dependencies.
```

**Success Case:**

```
Starting dependency check

Checking root functional dependencies...

Checking root dev dependencies...

Checking transitive functional dependecies...

Checking transitive dev dependecies...

CONGOS!!! No deprecated dependencies are found!
```
