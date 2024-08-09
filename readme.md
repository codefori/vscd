## vscd

Visual Studio Code package merger (`vscd`).

The `package.json` file is getting rather large for big extensions. This command line tool will search for all `contributes.json` files in current working directory to build up the `package.json`.

### `contributes.json`

Each `contributes.json` file must contain the `contributes` property. The contents of `contributes` is the same as what the `package.json` expects. See the [documentation for Contribution Points](https://code.visualstudio.com/api/references/contribution-points). Other properties are ignored.

### Guide

1. Install `vscd` as a `devDependency`: `npm i vscd --save-dev`
2. Update your build process to invoke `vscd`:

```json
"scripts": {
  "package": "vsce package",
  "vscode:prepublish": "rm -rf dist && npm run build",
  "webpack": "vscd --clean && webpack --mode development",
},
```

### Arguments

* `--clean` (optional, recommended) - the existing `package.json` contributions will be ignored and will be re-built from the `contributes.json` files.
* `-d <dir>` (optional) - force `vscd` to use another directory other than your working directory.