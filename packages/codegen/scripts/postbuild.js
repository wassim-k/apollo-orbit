const fs = require('fs');

const pkg = require('../package.json');
['scripts', 'devDependencies', 'publishConfig'].forEach(key => delete pkg[key]);
fs.writeFileSync('./dist/package.json', JSON.stringify(pkg, undefined, 4), 'utf-8');
fs.copyFileSync('./README.md', 'dist/README.md');
