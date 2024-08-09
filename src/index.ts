import { exists, getContent, getCwd, setContent, setVirtualCwd } from "./system";
import { globSync } from 'glob'
import JSON5 from 'json5';

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
      return JSON5.parse(content);
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
  
  const contributionPaths = globSync('**/contributes.json', { ignore: 'node_modules/**', cwd: getCwd() });

  const contributions: { [relativePath: string]: {commands: string[], content: any} } = {};

  for (const contributionPath of contributionPaths) {
    const content = getContent(contributionPath);
    const json = getAsJson(content);
  
    if (!json) {
      console.log(`Invalid contributes.json: ${contributionPath}`);
      continue;
    }

    if (!json.contributes) {
      console.log(`No contributes in ${contributionPath}`);
      continue;
    }
  
    contributions[contributionPath] = {
      commands: Array.isArray(json.contributes.commands) ? json.contributes.commands.map(c => c.command).filter(c => c) : [],
      content: json
    };
  }

  const findFileForCommand = (commandId: string) => {
    for (const [relativePath, contribution] of Object.entries(contributions)) {
      if (contribution.commands.includes(commandId)) {
        return relativePath;
      }
    }
  }
  
  for (const contributionRelativePath in contributions) {
    console.log(`Found contribution: ${contributionRelativePath}`);
    const contribution = contributions[contributionRelativePath];
  
    let baseJson = contribution.content;
  
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
                  const locationDefined = findFileForCommand(menuItem.command);
                  if (locationDefined) {
                    console.log(`\tmenus.${menuGroup} -> ${menuItem.command} command is defined in ${locationDefined}`);
                  } else {
                    console.log(`\tmenus.${menuGroup} -> ${menuItem.command} command is not defined`);
                  }
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