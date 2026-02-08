const fs = require("fs");
const target = "c:/Users/micha/saleor-platform/apps/apps/bulk-manager/src/modules/trpc/routers/orders-router.ts";
const b64 = process.argv[1];
const content = Buffer.from(b64, "base64").toString("utf8");
fs.writeFileSync(target, content);
console.log("Written", content.length, "chars");
