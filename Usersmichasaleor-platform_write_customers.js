const fs = require("fs");
const p = String.raw`c:Usersmichasaleor-platformappsappsulk-managersrcmodules	rpcouterscustomers-router.ts`;
const c = fs.readFileSync(0, "utf8");
fs.writeFileSync(p, c);
console.log("Written " + c.length + " chars");
