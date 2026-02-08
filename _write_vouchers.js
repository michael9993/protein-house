
const fs = require('fs');
const path = require('path');
const filePath = path.join('c:', 'Users', 'micha', 'saleor-platform', 'apps', 'apps', 'bulk-manager', 'src', 'modules', 'trpc', 'routers', 'vouchers-router.ts');

// Read content from stdin
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  fs.writeFileSync(filePath, data, 'utf8');
  console.log('Written', data.length, 'bytes to', filePath);
});
