const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');

const entriesToCopy = [
  'index.html',
  'servicos.html',
  'sobre.html',
  'atendimento.html',
  'feedbacks.html',
  'css',
  'js'
];

const optionalEntriesToCopy = [
  'assets'
];

function removeDirectory(targetPath) {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
}

function ensureDirectory(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function copyEntry(sourcePath, targetPath) {
  const stats = fs.statSync(sourcePath);

  if (stats.isDirectory()) {
    ensureDirectory(targetPath);

    for (const child of fs.readdirSync(sourcePath)) {
      copyEntry(path.join(sourcePath, child), path.join(targetPath, child));
    }

    return;
  }

  ensureDirectory(path.dirname(targetPath));
  fs.copyFileSync(sourcePath, targetPath);
}

removeDirectory(distDir);
ensureDirectory(distDir);

for (const entry of entriesToCopy) {
  const sourcePath = path.join(rootDir, entry);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Arquivo ou pasta nao encontrado: ${entry}`);
  }

  copyEntry(sourcePath, path.join(distDir, entry));
}

for (const entry of optionalEntriesToCopy) {
  const sourcePath = path.join(rootDir, entry);

  if (fs.existsSync(sourcePath)) {
    copyEntry(sourcePath, path.join(distDir, entry));
  }
}

console.log('Build estatico concluido em dist/');
