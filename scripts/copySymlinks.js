const fs = require('fs-extra');
const path = require('path');

function copySymlinks(srcDir, destDir) {
  try {
    fs.mkdirSync(destDir, { recursive: true });

    const files = fs.readdirSync(srcDir, { withFileTypes: true });

    for (const file of files) {
      const srcPath = path.join(srcDir, file.name);
      const destPath = path.join(destDir, file.name);

      if (!file.isSymbolicLink() || fs.existsSync(destPath)) continue;

      const link = fs.readlinkSync(srcPath);

      if (process.platform === 'win32' && path.isAbsolute(link)) {
        fs.symlinkSync(link, destPath, 'junction');
      } else {
        fs.symlinkSync(path.relative(path.dirname(destPath), link) || '.', destPath);
      }
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

const srcDir = 'node_modules/@apollo-orbit';
const destDir = 'integration/angular/node_modules/@apollo-orbit';

copySymlinks(srcDir, destDir);
