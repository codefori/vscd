## vscd

Visual Studio Code package merger (`vscd`).

The `package.json` file is getting rather large for big extensions. This command line tool will search for all `contributes.json` files in current working directory to build up the `package.json`. 

### Arguments

* `--clean` (optional, recommended) - the existing `package.json` contributions will be ignored and will be re-built from the `contributes.json` files.
* `-d <dir>` (optional) - force `vscd` to use another directory other than your working directory.