import { exists, getContent, getCwd, setContent, setVirtualCwd } from "./system";
import { globSync } from 'glob'

const args = process.argv.slice(2);
let clean = false;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case `-d`:
      setVirtualCwd(args[++i]);
      break;
    case `--clean`:
      clean = true;
  }
}

main();

async function main() {
  const packageExists = exists(`package.json`);

  const getAsJson = (content: string) => {
    try {
      return JSON.parse(content);
    } catch (e) {
      return undefined;
    }
  }
  
  if (!packageExists) {
    console.log(`No package.json found!`);
    process.exit(1);
  }
  
  const packageJson = getAsJson(getContent(`package.json`));
  
  if (!packageJson) {
    console.log(`Invalid package.json!`);
    process.exit(1);
  }
  
  if (!packageJson.contributes || clean) {
    packageJson.contributes = {};
  }
  
  const contributions = globSync('**/contributes.json', { ignore: 'node_modules/**', cwd: getCwd() });
  
  for (const contribution of contributions) {
    console.log(`Found contribution: ${contribution}`);
  
    let baseJson = getAsJson(getContent(contribution));
  
    if (!baseJson) {
      console.log(`Invalid contributes.json!`);
      process.exit(1);
    }
  
    if (baseJson.contributes) {
      // Validate commands references in menus exist in commands
      const commandDefs = baseJson.contributes.commands;
      if (commandDefs) {
        const commandIds: string[] = commandDefs.map(c => c.command).filter(x => x);

        const menuDefs = baseJson.contributes.menus;
        const keybindings = baseJson.contributes.keybindings;

        if (menuDefs) {
          const menuGroups = Object.keys(menuDefs);

          for (const menuGroup of menuGroups) {
            const menu = menuDefs[menuGroup];
            for (const menuItem of menu) {
              if (menuItem.command) {
                if (!commandIds.includes(menuItem.command)) {
                  console.log(`\tmenus.${menuGroup}->${menuItem.command} not found in commands`);
                }
              }
            }
          }
        }

        if (keybindings) {
          for (const keybinding of keybindings) {
            if (keybinding.command) {
              if (!commandIds.includes(keybinding.command)) {
                console.log(`\tkeybindings->${keybinding.command} not found in commands`);
              }
            }
          }
        }
      }

      mergeObjects(packageJson.contributes, baseJson.contributes);
    }
  }
  
  setContent(`package.json`, JSON.stringify(packageJson, null, 2));
}

function mergeObjects(base, include) {
  for (const key in include) {
    if (!base[key]) {
      base[key] = include[key];
    } else {
      if (Array.isArray(base[key]) && Array.isArray(include[key])) {
        for (const newItem of include[key]) {
          const objectId = newItem.command ? `command` : newItem.id ? `id` : newItem.submenu ? `submenu` : undefined;
          const existingEntry = objectId ? base[key].findIndex((item) => item[objectId] === newItem[objectId]) : -1;

          if (existingEntry >= 0) {
            base[key][existingEntry] = newItem;
          } else {
            base[key].push(newItem);
          }
        }

      } else if (typeof base[key] === 'object') {
        mergeObjects(base[key], include[key]);
      } else {
        base[key] = include[key];
      }
    }
  }
}