const fs = require("fs");
const path = require("path");

const heFile = path.join(__dirname, "../apps/apps/storefront-control/sample-config-import.json");
const enFile = path.join(__dirname, "../apps/apps/storefront-control/sample-config-import-en.json");

const heData = JSON.parse(fs.readFileSync(heFile, "utf8"));
const enData = JSON.parse(fs.readFileSync(enFile, "utf8"));

let changes = 0;

// 1. Add missing cart text fields to English config
if (!enData.config.content.cart.youSaveLabel) {
  enData.config.content.cart.youSaveLabel = "You save";
  console.log("EN: Added content.cart.youSaveLabel");
  changes++;
}
if (!enData.config.content.cart.eligibleForFreeShipping) {
  enData.config.content.cart.eligibleForFreeShipping = "Eligible for free shipping";
  console.log("EN: Added content.cart.eligibleForFreeShipping");
  changes++;
}
if (!enData.config.content.cart.originalSubtotalLabel) {
  enData.config.content.cart.originalSubtotalLabel = "Subtotal";
  console.log("EN: Added content.cart.originalSubtotalLabel");
  changes++;
}
if (!enData.config.content.cart.discountedSubtotalLabel) {
  enData.config.content.cart.discountedSubtotalLabel = "Discounted subtotal";
  console.log("EN: Added content.cart.discountedSubtotalLabel");
  changes++;
}

// 2. Add missing cart text fields to Hebrew config
if (!heData.config.content.cart.removeButton) {
  heData.config.content.cart.removeButton = "הסרה";
  console.log("HE: Added content.cart.removeButton");
  changes++;
}
if (!heData.config.content.cart.removingText) {
  heData.config.content.cart.removingText = "מסיר...";
  console.log("HE: Added content.cart.removingText");
  changes++;
}

// 3. Add missing footer policy fields to English config
const policyFields = {
  returnPolicyHeader: "Return Policy",
  returnPolicyDefaultContent: "We accept returns within 30 days of purchase. Items must be in original condition with tags attached.",
  returnPolicyFooter: "",
  shippingPolicyHeader: "Shipping Policy",
  shippingPolicyDefaultContent: "We offer free standard shipping on orders over $50. Express shipping available at checkout.",
  shippingPolicyFooter: "",
  privacyPolicyHeader: "Privacy Policy",
  privacyPolicyDefaultContent: "We respect your privacy and protect your personal information. Read our full privacy policy for details.",
  privacyPolicyFooter: "",
  termsOfServiceHeader: "Terms of Service",
  termsOfServiceDefaultContent: "By using our services, you agree to our terms and conditions. Please read carefully before purchasing.",
  termsOfServiceFooter: "",
};

for (const [key, enValue] of Object.entries(policyFields)) {
  if (enData.config.footer[key] === undefined) {
    enData.config.footer[key] = enValue;
    console.log("EN: Added footer." + key);
    changes++;
  }
}

// Write updated files
fs.writeFileSync(heFile, JSON.stringify(heData, null, 2) + "\n");
fs.writeFileSync(enFile, JSON.stringify(enData, null, 2) + "\n");

console.log("\nTotal changes: " + changes);
