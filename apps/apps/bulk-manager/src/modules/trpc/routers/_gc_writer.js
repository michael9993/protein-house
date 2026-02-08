const fs=require("fs");
const BT=String.fromCharCode(96);
const p="c:/Users/micha/saleor-platform/apps/apps/bulk-manager/src/modules/trpc/routers/gift-cards-router.ts";
const c=fs.readFileSync("c:/Users/micha/saleor-platform/apps/apps/bulk-manager/src/modules/trpc/routers/_gc_content.txt","utf-8");
const out=c.replace(/BACKTICK/g,BT);
fs.writeFileSync(p,out);
console.log("Done:",out.length,"bytes");