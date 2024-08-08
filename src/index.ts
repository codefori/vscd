import { exists, getContent, getCwd, setContent, setVirtualCwd } from "./system";
import { globSync } from 'glob'

const args = process.argv.slice(2);

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case `--help`:
      break;
    case `-d`:
      setVirtualCwd(args[++i]);
      break;
  }
}

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

if (!packageJson.contributes) {
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
    mergeObjects(packageJson.contributes, baseJson.contributes);
  }
}

setContent(`package.json`, JSON.stringify(packageJson, null, 2));

function mergeObjects(base, include) {
  for (const key in include) {
    if (!base[key]) {
      base[key] = include[key];
    } else {
      if (Array.isArray(base[key]) && Array.isArray(include[key])) {
        for (const newItem of include[key]) {
          const objectId = newItem.command ? `command` : newItem.id ? `id` : undefined;
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