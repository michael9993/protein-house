const fs = require("fs");
const path = require("path");
const dataPath = path.join(path.dirname(process.argv[1] || __filename), "_content.b64");
const targetPath = "c:/Users/micha/saleor-platform/apps/apps/bulk-manager/src/modules/trpc/routers/orders-router.ts";
const b64 = fs.readFileSync(dataPath, "utf8").trim();
const content = Buffer.from(b64, "base64").toString("utf8");
fs.writeFileSync(targetPath, content);
console.log("Written " + content.length + " chars to orders-router.ts");
// Cleanup
fs.unlinkSync(dataPath);
fs.unlinkSync(process.argv[1] || __filename);