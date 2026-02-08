// Auto-generated writer script
const fs = require("fs");
const BT = String.fromCharCode(96);
const b64 = fs.readFileSync("c:/Users/micha/saleor-platform/_gc_b64.txt","utf-8").trim();
const content = Buffer.from(b64,"base64").toString("utf-8");
fs.writeFileSync("c:/Users/micha/saleor-platform/apps/apps/bulk-manager/src/modules/trpc/routers/gift-cards-router.ts", content);
console.log("Written", content.length, "bytes");
