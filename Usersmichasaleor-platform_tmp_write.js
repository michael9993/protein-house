
const fs = require('fs');
const filepath = 'c:\Users\micha\saleor-platform\apps\apps\bulk-manager\src\modules\trpc\routers\customers-router.ts';
const content = fs.readFileSync('c:\Users\micha\saleor-platform\_tmp_content.txt', 'utf8');
fs.writeFileSync(filepath, content, 'utf8');
console.log('Written ' + content.length + ' chars');
fs.unlinkSync('c:\Users\micha\saleor-platform\_tmp_content.txt');
fs.unlinkSync('c:\Users\micha\saleor-platform\_tmp_write.js');
