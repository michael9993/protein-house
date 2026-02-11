import "dotenv/config";
import { execSync } from "child_process";

const args = process.argv.slice(2).join(" ");
const url = process.env.SALEOR_URL;
const token = process.env.SALEOR_TOKEN;

if (!url || !token) {
  console.error("Missing SALEOR_URL or SALEOR_TOKEN in .env");
  process.exit(1);
}

execSync(`npx @saleor/configurator ${args} --url ${url} --token ${token}`, {
  stdio: "inherit",
  cwd: process.cwd(),
});
