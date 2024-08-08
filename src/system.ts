import path from 'path';
import fs from 'fs';

let virtualCwd = process.cwd();

export function getPlaform() {
  return process.platform;
}

export function getCwd() {
  return virtualCwd;
}

export function setVirtualCwd(cwd: string) {
  virtualCwd = cwd;
}

export function getContent(relativePath: string) {
  const fullPath = path.join(virtualCwd, relativePath);
  return fs.readFileSync(fullPath, 'utf8');
}

export function setContent(relativePath: string, content: string) {
  const fullPath = path.join(virtualCwd, relativePath);
  fs.writeFileSync(fullPath, content);
}

export function exists(relativePath: string) {
  const fullPath = path.join(virtualCwd, relativePath);

  return fs.existsSync(fullPath);
}
