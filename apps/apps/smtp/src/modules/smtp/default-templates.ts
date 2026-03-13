import { MessageEventTypes } from "../event-handlers/message-event-types";
import type { TemplateLanguage } from "./configuration/smtp-config-schema";

/*
 * ============================================================================
 * BRANDING VARIABLES — Replaced at runtime by TemplateBrandingProcessor
 * ============================================================================
 * ${PRIMARY_COLOR}    — Brand primary color (fetched from Storefront Control)
 * ${SECONDARY_COLOR}  — Brand secondary color
 * ${COMPANY_NAME}     — Store name
 * ${COMPANY_EMAIL}    — Support email
 * ${COMPANY_WEBSITE}  — Store website URL
 * ${COMPANY_TAGLINE}  — Store tagline / slogan
 * ${STOREFRONT_URL}   — Storefront base URL (for links in emails)
 * ${LOGO_URL}         — Store logo image URL
 * ============================================================================
 */

// ─── Shared Fragments (English) ─────────────────────────────────────────────

const headerEn = `
    <mj-section background-color="\${PRIMARY_COLOR}" padding="20px 24px 16px">
      <mj-column>
        <mj-image src="\${LOGO_URL}" alt="\${COMPANY_NAME}" width="160px" align="center" padding="0" />
      </mj-column>
    </mj-section>
    <mj-section padding="0">
      <mj-column>
        <mj-divider border-color="\${SECONDARY_COLOR}" border-width="2px" padding="0" />
      </mj-column>
    </mj-section>`;

const footerEn = `
    <mj-section padding="0">
      <mj-column>
        <mj-divider border-color="\${SECONDARY_COLOR}" border-width="1px" padding="0 24px" />
      </mj-column>
    </mj-section>
    <mj-section background-color="\${PRIMARY_COLOR}" padding="28px 24px 20px">
      <mj-column>
        <mj-image src="\${LOGO_URL}" alt="\${COMPANY_NAME}" width="100px" align="center" padding="0 0 12px 0" />
        <mj-text align="center" font-size="12px" color="rgba(255,255,255,0.7)" padding="0 0 8px 0" line-height="1.5">
          \${COMPANY_TAGLINE}
        </mj-text>
        <mj-text align="center" font-size="13px" color="rgba(255,255,255,0.6)" padding="0 0 4px 0">
          Questions? <a href="mailto:\${COMPANY_EMAIL}" style="color: \${SECONDARY_COLOR}; text-decoration: none;">\${COMPANY_EMAIL}</a>
        </mj-text>
        <mj-text align="center" font-size="11px" color="rgba(255,255,255,0.4)" padding="4px 0 0 0">
          &copy; ${new Date().getFullYear()} \${COMPANY_NAME}. All rights reserved.
        </mj-text>
      </mj-column>
    </mj-section>`;

const emailHeadEn = `
  <mj-head>
    <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
    <mj-attributes>
      <mj-all font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" />
      <mj-text font-size="14px" color="#374151" line-height="1.6" padding="0 24px 12px" />
      <mj-section padding="0" background-color="#FFFFFF" />
      <mj-button background-color="\${PRIMARY_COLOR}" color="#FFFFFF" font-size="14px" font-weight="600" border-radius="6px" inner-padding="12px 28px" />
    </mj-attributes>
    <mj-style inline="inline">
      .detail-row { padding: 10px 0; border-bottom: 1px solid #F3F4F6; }
      .detail-row:last-child { border-bottom: none; }
      .accent { color: \${PRIMARY_COLOR}; font-weight: 600; }
      .gold-accent { color: \${SECONDARY_COLOR}; font-weight: 600; }
      .info-box { border-radius: 8px; border: 1px solid #E5E7EB; }
      .reply-box { border-radius: 8px; border-left: 4px solid \${SECONDARY_COLOR}; }
      .success-box { border-radius: 8px; border: 1px solid #D1FAE5; background-color: #ECFDF5; }
      .danger-box { border-radius: 8px; border: 1px solid #FEE2E2; background-color: #FEF2F2; }
    </mj-style>
  </mj-head>`;

const orderItemsTableEn = `
        <mj-table padding="0" cellpadding="0">
          <thead>
            <tr style="border-bottom: 2px solid #E5E7EB;">
              <th style="text-align: left; padding: 10px 0; font-size: 11px; text-transform: uppercase; color: #6B7280; font-weight: 600; letter-spacing: 0.05em;">Item</th>
              <th style="text-align: center; padding: 10px 0; font-size: 11px; text-transform: uppercase; color: #6B7280; font-weight: 600; letter-spacing: 0.05em;">Qty</th>
              <th style="text-align: right; padding: 10px 0; font-size: 11px; text-transform: uppercase; color: #6B7280; font-weight: 600; letter-spacing: 0.05em;">Price</th>
            </tr>
          </thead>
          <tbody>
            {{#each order.lines}}
            <tr style="border-bottom: 1px solid #F3F4F6;">
              <td style="padding: 12px 0; color: #374151; font-size: 14px;">{{this.productName}}{{#if this.variantName}} — {{this.variantName}}{{/if}}</td>
              <td style="text-align: center; padding: 12px 0; color: #6B7280; font-size: 14px;">{{this.quantity}}</td>
              <td style="text-align: right; padding: 12px 0; color: #374151; font-weight: 500; font-size: 14px;">{{this.totalPrice.gross.amount}} {{this.totalPrice.gross.currency}}</td>
            </tr>
            {{/each}}
          </tbody>
        </mj-table>`;

const orderTotalsEn = `
        <mj-table padding="12px 0 0 0">
          <tbody>
            {{#if order.shippingPrice}}
            <tr>
              <td style="text-align: right; padding: 6px 0; color: #6B7280; font-size: 13px;">Shipping:</td>
              <td style="text-align: right; padding: 6px 0 6px 16px; color: #374151; font-weight: 500; font-size: 13px; width: 120px;">{{order.shippingPrice.gross.amount}} {{order.shippingPrice.gross.currency}}</td>
            </tr>
            {{/if}}
            {{#if order.discounts.length}}
            <tr>
              <td style="text-align: right; padding: 6px 0; color: #059669; font-size: 13px;">Discount:</td>
              <td style="text-align: right; padding: 6px 0 6px 16px; color: #059669; font-weight: 500; font-size: 13px; width: 120px;">-{{order.discounts.0.amount.amount}} {{order.total.gross.currency}}</td>
            </tr>
            {{/if}}
            <tr style="border-top: 2px solid \${SECONDARY_COLOR};">
              <td style="text-align: right; padding: 14px 0 0 0; color: \${PRIMARY_COLOR}; font-size: 16px; font-weight: 700;">Total:</td>
              <td style="text-align: right; padding: 14px 0 0 16px; color: \${PRIMARY_COLOR}; font-size: 16px; font-weight: 700; width: 120px;">{{order.total.gross.amount}} {{order.total.gross.currency}}</td>
            </tr>
          </tbody>
        </mj-table>`;

const addressBlockEn = `
    <mj-section background-color="#FFFFFF" padding="0 24px 24px">
      <mj-column padding-right="12px">
        <mj-text font-size="11px" text-transform="uppercase" letter-spacing="0.05em" color="#6B7280" font-weight="600" padding-bottom="6px">
          Billing Address
        </mj-text>
        <mj-text font-size="13px" color="#374151" line-height="1.5">
          {{#if order.billingAddress}}
            {{order.billingAddress.streetAddress1}}<br/>
            {{#if order.billingAddress.streetAddress2}}{{order.billingAddress.streetAddress2}}<br/>{{/if}}
            {{order.billingAddress.city}}{{#if order.billingAddress.postalCode}}, {{order.billingAddress.postalCode}}{{/if}}<br/>
            {{order.billingAddress.country.country}}
          {{else}}
            —
          {{/if}}
        </mj-text>
      </mj-column>
      <mj-column padding-left="12px">
        <mj-text font-size="11px" text-transform="uppercase" letter-spacing="0.05em" color="#6B7280" font-weight="600" padding-bottom="6px">
          Shipping Address
        </mj-text>
        <mj-text font-size="13px" color="#374151" line-height="1.5">
          {{#if order.shippingAddress}}
            {{order.shippingAddress.streetAddress1}}<br/>
            {{#if order.shippingAddress.streetAddress2}}{{order.shippingAddress.streetAddress2}}<br/>{{/if}}
            {{order.shippingAddress.city}}{{#if order.shippingAddress.postalCode}}, {{order.shippingAddress.postalCode}}{{/if}}<br/>
            {{order.shippingAddress.country.country}}
          {{else}}
            No shipping required
          {{/if}}
        </mj-text>
      </mj-column>
    </mj-section>`;

const addressBlockForNotifyEn = `
    <mj-section background-color="#FFFFFF" padding="0 24px 24px">
      <mj-column padding-right="12px">
        <mj-text font-size="11px" text-transform="uppercase" letter-spacing="0.05em" color="#6B7280" font-weight="600" padding-bottom="6px">
          Billing Address
        </mj-text>
        <mj-text font-size="13px" color="#374151" line-height="1.5">
          {{#if order.billing_address}}
            {{order.billing_address.street_address_1}}<br/>
            {{#if order.billing_address.street_address_2}}{{order.billing_address.street_address_2}}<br/>{{/if}}
            {{order.billing_address.city}}{{#if order.billing_address.postal_code}}, {{order.billing_address.postal_code}}{{/if}}
          {{else}}
            —
          {{/if}}
        </mj-text>
      </mj-column>
      <mj-column padding-left="12px">
        <mj-text font-size="11px" text-transform="uppercase" letter-spacing="0.05em" color="#6B7280" font-weight="600" padding-bottom="6px">
          Shipping Address
        </mj-text>
        <mj-text font-size="13px" color="#374151" line-height="1.5">
          {{#if order.shipping_address}}
            {{order.shipping_address.street_address_1}}<br/>
            {{#if order.shipping_address.street_address_2}}{{order.shipping_address.street_address_2}}<br/>{{/if}}
            {{order.shipping_address.city}}{{#if order.shipping_address.postal_code}}, {{order.shipping_address.postal_code}}{{/if}}
          {{else}}
            No shipping required
          {{/if}}
        </mj-text>
      </mj-column>
    </mj-section>`;

// ─── Shared Fragments (Hebrew / RTL) ────────────────────────────────────────

const headerHe = `
    <mj-section background-color="\${PRIMARY_COLOR}" padding="20px 24px 16px">
      <mj-column>
        <mj-image src="\${LOGO_URL}" alt="\${COMPANY_NAME}" width="160px" align="center" padding="0" />
      </mj-column>
    </mj-section>
    <mj-section padding="0">
      <mj-column>
        <mj-divider border-color="\${SECONDARY_COLOR}" border-width="2px" padding="0" />
      </mj-column>
    </mj-section>`;

const footerHe = `
    <mj-section padding="0">
      <mj-column>
        <mj-divider border-color="\${SECONDARY_COLOR}" border-width="1px" padding="0 24px" />
      </mj-column>
    </mj-section>
    <mj-section background-color="\${PRIMARY_COLOR}" padding="28px 24px 20px">
      <mj-column>
        <mj-image src="\${LOGO_URL}" alt="\${COMPANY_NAME}" width="100px" align="center" padding="0 0 12px 0" />
        <mj-text align="center" font-size="12px" color="rgba(255,255,255,0.7)" padding="0 0 8px 0" line-height="1.5">
          \${COMPANY_TAGLINE}
        </mj-text>
        <mj-text align="center" font-size="13px" color="rgba(255,255,255,0.6)" padding="0 0 4px 0">
          שאלות? <a href="mailto:\${COMPANY_EMAIL}" style="color: \${SECONDARY_COLOR}; text-decoration: none;">\${COMPANY_EMAIL}</a>
        </mj-text>
        <mj-text align="center" font-size="11px" color="rgba(255,255,255,0.4)" padding="4px 0 0 0">
          &copy; ${new Date().getFullYear()} \${COMPANY_NAME}. כל הזכויות שמורות.
        </mj-text>
      </mj-column>
    </mj-section>`;

const emailHeadHe = `
  <mj-head>
    <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
    <mj-attributes>
      <mj-all font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" />
      <mj-text font-size="14px" color="#374151" line-height="1.6" padding="0 24px 12px" align="right" />
      <mj-section padding="0" background-color="#FFFFFF" />
      <mj-button background-color="\${PRIMARY_COLOR}" color="#FFFFFF" font-size="14px" font-weight="600" border-radius="6px" inner-padding="12px 28px" />
    </mj-attributes>
    <mj-style inline="inline">
      body, div, td, th, span { direction: rtl; text-align: right; }
      table { direction: rtl; }
      .detail-row { padding: 10px 0; border-bottom: 1px solid #F3F4F6; }
      .detail-row:last-child { border-bottom: none; }
      .accent { color: \${PRIMARY_COLOR}; font-weight: 600; }
      .gold-accent { color: \${SECONDARY_COLOR}; font-weight: 600; }
      .info-box { border-radius: 8px; border: 1px solid #E5E7EB; }
      .reply-box { border-radius: 8px; border-right: 4px solid \${SECONDARY_COLOR}; }
      .success-box { border-radius: 8px; border: 1px solid #D1FAE5; background-color: #ECFDF5; }
      .danger-box { border-radius: 8px; border: 1px solid #FEE2E2; background-color: #FEF2F2; }
    </mj-style>
  </mj-head>`;

const orderItemsTableHe = `
        <mj-table padding="0" cellpadding="0">
          <thead>
            <tr style="border-bottom: 2px solid #E5E7EB;">
              <th style="text-align: right; padding: 10px 0; font-size: 11px; text-transform: uppercase; color: #6B7280; font-weight: 600; letter-spacing: 0.05em;">פריט</th>
              <th style="text-align: center; padding: 10px 0; font-size: 11px; text-transform: uppercase; color: #6B7280; font-weight: 600; letter-spacing: 0.05em;">כמות</th>
              <th style="text-align: left; padding: 10px 0; font-size: 11px; text-transform: uppercase; color: #6B7280; font-weight: 600; letter-spacing: 0.05em;">מחיר</th>
            </tr>
          </thead>
          <tbody>
            {{#each order.lines}}
            <tr style="border-bottom: 1px solid #F3F4F6;">
              <td style="padding: 12px 0; color: #374151; font-size: 14px; text-align: right;">{{this.productName}}{{#if this.variantName}} — {{this.variantName}}{{/if}}</td>
              <td style="text-align: center; padding: 12px 0; color: #6B7280; font-size: 14px;">{{this.quantity}}</td>
              <td style="text-align: left; padding: 12px 0; color: #374151; font-weight: 500; font-size: 14px;">{{this.totalPrice.gross.amount}} {{this.totalPrice.gross.currency}}</td>
            </tr>
            {{/each}}
          </tbody>
        </mj-table>`;

const orderTotalsHe = `
        <mj-table padding="12px 0 0 0">
          <tbody>
            {{#if order.shippingPrice}}
            <tr>
              <td style="text-align: left; padding: 6px 0; color: #6B7280; font-size: 13px;">משלוח:</td>
              <td style="text-align: left; padding: 6px 16px 6px 0; color: #374151; font-weight: 500; font-size: 13px; width: 120px;">{{order.shippingPrice.gross.amount}} {{order.shippingPrice.gross.currency}}</td>
            </tr>
            {{/if}}
            {{#if order.discounts.length}}
            <tr>
              <td style="text-align: left; padding: 6px 0; color: #059669; font-size: 13px;">הנחה:</td>
              <td style="text-align: left; padding: 6px 16px 6px 0; color: #059669; font-weight: 500; font-size: 13px; width: 120px;">-{{order.discounts.0.amount.amount}} {{order.total.gross.currency}}</td>
            </tr>
            {{/if}}
            <tr style="border-top: 2px solid \${SECONDARY_COLOR};">
              <td style="text-align: left; padding: 14px 0 0 0; color: \${PRIMARY_COLOR}; font-size: 16px; font-weight: 700;">סה"כ:</td>
              <td style="text-align: left; padding: 14px 16px 0 0; color: \${PRIMARY_COLOR}; font-size: 16px; font-weight: 700; width: 120px;">{{order.total.gross.amount}} {{order.total.gross.currency}}</td>
            </tr>
          </tbody>
        </mj-table>`;

const addressBlockHe = `
    <mj-section background-color="#FFFFFF" padding="0 24px 24px">
      <mj-column padding-left="12px">
        <mj-text font-size="11px" letter-spacing="0.05em" color="#6B7280" font-weight="600" padding-bottom="6px" align="right">
          כתובת משלוח
        </mj-text>
        <mj-text font-size="13px" color="#374151" line-height="1.5" align="right">
          {{#if order.shippingAddress}}
            {{order.shippingAddress.streetAddress1}}<br/>
            {{#if order.shippingAddress.streetAddress2}}{{order.shippingAddress.streetAddress2}}<br/>{{/if}}
            {{order.shippingAddress.city}}{{#if order.shippingAddress.postalCode}}, {{order.shippingAddress.postalCode}}{{/if}}<br/>
            {{order.shippingAddress.country.country}}
          {{else}}
            לא נדרש משלוח
          {{/if}}
        </mj-text>
      </mj-column>
      <mj-column padding-right="12px">
        <mj-text font-size="11px" letter-spacing="0.05em" color="#6B7280" font-weight="600" padding-bottom="6px" align="right">
          כתובת חיוב
        </mj-text>
        <mj-text font-size="13px" color="#374151" line-height="1.5" align="right">
          {{#if order.billingAddress}}
            {{order.billingAddress.streetAddress1}}<br/>
            {{#if order.billingAddress.streetAddress2}}{{order.billingAddress.streetAddress2}}<br/>{{/if}}
            {{order.billingAddress.city}}{{#if order.billingAddress.postalCode}}, {{order.billingAddress.postalCode}}{{/if}}<br/>
            {{order.billingAddress.country.country}}
          {{else}}
            —
          {{/if}}
        </mj-text>
      </mj-column>
    </mj-section>`;

const addressBlockForNotifyHe = `
    <mj-section background-color="#FFFFFF" padding="0 24px 24px">
      <mj-column padding-left="12px">
        <mj-text font-size="11px" letter-spacing="0.05em" color="#6B7280" font-weight="600" padding-bottom="6px" align="right">
          כתובת משלוח
        </mj-text>
        <mj-text font-size="13px" color="#374151" line-height="1.5" align="right">
          {{#if order.shipping_address}}
            {{order.shipping_address.street_address_1}}<br/>
            {{#if order.shipping_address.street_address_2}}{{order.shipping_address.street_address_2}}<br/>{{/if}}
            {{order.shipping_address.city}}{{#if order.shipping_address.postal_code}}, {{order.shipping_address.postal_code}}{{/if}}
          {{else}}
            לא נדרש משלוח
          {{/if}}
        </mj-text>
      </mj-column>
      <mj-column padding-right="12px">
        <mj-text font-size="11px" letter-spacing="0.05em" color="#6B7280" font-weight="600" padding-bottom="6px" align="right">
          כתובת חיוב
        </mj-text>
        <mj-text font-size="13px" color="#374151" line-height="1.5" align="right">
          {{#if order.billing_address}}
            {{order.billing_address.street_address_1}}<br/>
            {{#if order.billing_address.street_address_2}}{{order.billing_address.street_address_2}}<br/>{{/if}}
            {{order.billing_address.city}}{{#if order.billing_address.postal_code}}, {{order.billing_address.postal_code}}{{/if}}
          {{else}}
            —
          {{/if}}
        </mj-text>
      </mj-column>
    </mj-section>`;

// ═══════════════════════════════════════════════════════════════════════════
// ENGLISH TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

const enOrderCreated = `<mjml>
  ${emailHeadEn}
  <mj-body background-color="#F3F4F6">
    ${headerEn}
    <mj-section background-color="\${PRIMARY_COLOR}" padding="28px 24px">
      <mj-column>
        <mj-text align="center" font-size="22px" font-weight="700" color="#FFFFFF" padding="0">
          Order Confirmation
        </mj-text>
        <mj-text align="center" font-size="14px" color="rgba(255,255,255,0.8)" padding="6px 0 0">
          Thank you for your order!
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#FFFFFF" padding="28px 24px">
      <mj-column>
        <mj-text font-size="15px" color="#111827" padding-bottom="16px">
          We've received your order and will begin processing it shortly.
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box">
          <div class="detail-row"><strong>Order:</strong> <span class="accent">#{{order.number}}</span></div>
          <div class="detail-row"><strong>Date:</strong> {{formatDate order.created}}</div>
          <div class="detail-row"><strong>Total:</strong> <span class="accent">{{order.total.gross.amount}} {{order.total.gross.currency}}</span></div>
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#FFFFFF" padding="0 24px 24px">
      <mj-column>
        <mj-text font-size="15px" font-weight="600" color="#111827" padding-bottom="12px">
          Order Items
        </mj-text>
        ${orderItemsTableEn}
        ${orderTotalsEn}
      </mj-column>
    </mj-section>
    ${addressBlockEn}
    ${footerEn}
  </mj-body>
</mjml>`;

const enOrderConfirmed = `<mjml>
  ${emailHeadEn}
  <mj-body background-color="#F3F4F6">
    ${headerEn}
    <mj-section background-color="\${PRIMARY_COLOR}" padding="28px 24px">
      <mj-column>
        <mj-text align="center" font-size="22px" font-weight="700" color="#FFFFFF" padding="0">
          Order Confirmed
        </mj-text>
        <mj-text align="center" font-size="14px" color="rgba(255,255,255,0.8)" padding="6px 0 0">
          Order #{{order.number}}
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#FFFFFF" padding="28px 24px">
      <mj-column>
        <mj-text font-size="15px" color="#111827" padding-bottom="16px">
          Your order has been confirmed and is now being prepared. We'll notify you once it's on its way.
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box">
          <div class="detail-row"><strong>Order:</strong> <span class="accent">#{{order.number}}</span></div>
          <div class="detail-row"><strong>Status:</strong> <span style="color: #059669; font-weight: 600;">Confirmed</span></div>
          <div class="detail-row"><strong>Total:</strong> {{order.total.gross.amount}} {{order.total.gross.currency}}</div>
        </mj-text>
      </mj-column>
    </mj-section>
    ${addressBlockEn}
    ${footerEn}
  </mj-body>
</mjml>`;

const enOrderFullyPaid = `<mjml>
  ${emailHeadEn}
  <mj-body background-color="#F3F4F6">
    ${headerEn}
    <mj-section background-color="#FFFFFF" padding="32px 24px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827" padding-bottom="8px">
          Payment Received
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="20px">
          Your payment for order <strong>#{{order.number}}</strong> has been received. Thank you!
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box">
          <div class="detail-row"><strong>Order:</strong> <span class="accent">#{{order.number}}</span></div>
          <div class="detail-row"><strong>Payment Status:</strong> <span style="color: #059669; font-weight: 600;">Paid</span></div>
          <div class="detail-row"><strong>Amount:</strong> <span class="accent">{{order.total.gross.amount}} {{order.total.gross.currency}}</span></div>
        </mj-text>
      </mj-column>
    </mj-section>
    ${addressBlockEn}
    ${footerEn}
  </mj-body>
</mjml>`;

const enOrderFulfilled = `<mjml>
  ${emailHeadEn}
  <mj-body background-color="#F3F4F6">
    ${headerEn}
    <mj-section background-color="\${PRIMARY_COLOR}" padding="28px 24px">
      <mj-column>
        <mj-text align="center" font-size="22px" font-weight="700" color="#FFFFFF" padding="0">
          Your Order is On Its Way
        </mj-text>
        <mj-text align="center" font-size="14px" color="rgba(255,255,255,0.8)" padding="6px 0 0">
          Order #{{order.number}} has been shipped
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#FFFFFF" padding="28px 24px">
      <mj-column>
        <mj-text font-size="15px" color="#111827" padding-bottom="16px">
          Great news! Your order has been fulfilled and is on its way to you.
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box">
          <div class="detail-row"><strong>Order:</strong> <span class="accent">#{{order.number}}</span></div>
          {{#if fulfillment.tracking_number}}
          <div class="detail-row"><strong>Tracking:</strong> <span style="font-family: 'JetBrains Mono', monospace; color: \${PRIMARY_COLOR}; font-weight: 600;">{{fulfillment.tracking_number}}</span></div>
          {{/if}}
          <div class="detail-row"><strong>Status:</strong> <span style="color: #059669; font-weight: 600;">Shipped</span></div>
        </mj-text>
        {{#if fulfillment.tracking_number}}
        <mj-button background-color="\${PRIMARY_COLOR}" color="#FFFFFF" font-size="14px" font-weight="600" border-radius="6px" inner-padding="12px 28px" href="https://t.17track.net/en#nums={{fulfillment.tracking_number}}" padding-top="16px">
          Track Your Package
        </mj-button>
        {{/if}}
      </mj-column>
    </mj-section>
    ${addressBlockEn}
    ${footerEn}
  </mj-body>
</mjml>`;

const enOrderFulfillmentUpdate = `<mjml>
  ${emailHeadEn}
  <mj-body background-color="#F3F4F6">
    ${headerEn}
    <mj-section background-color="#FFFFFF" padding="32px 24px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827" padding-bottom="8px">
          Shipment Update
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="20px">
          We have an update on the shipment for your order <strong>#{{order.number}}</strong>.
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box">
          <div class="detail-row"><strong>Order:</strong> <span class="accent">#{{order.number}}</span></div>
          {{#if fulfillment.tracking_number}}
          <div class="detail-row"><strong>Tracking:</strong> <span style="font-family: 'JetBrains Mono', monospace; color: \${PRIMARY_COLOR}; font-weight: 600;">{{fulfillment.tracking_number}}</span></div>
          {{/if}}
          <div class="detail-row"><strong>Status:</strong> <span style="color: #059669; font-weight: 600;">Updated</span></div>
        </mj-text>
        {{#if fulfillment.tracking_number}}
        <mj-button background-color="\${PRIMARY_COLOR}" color="#FFFFFF" font-size="14px" font-weight="600" border-radius="6px" inner-padding="12px 28px" href="https://t.17track.net/en#nums={{fulfillment.tracking_number}}" padding-top="16px">
          Track Your Package
        </mj-button>
        {{/if}}
      </mj-column>
    </mj-section>
    ${addressBlockForNotifyEn}
    ${footerEn}
  </mj-body>
</mjml>`;

const enOrderRefunded = `<mjml>
  ${emailHeadEn}
  <mj-body background-color="#F3F4F6">
    ${headerEn}
    <mj-section background-color="#FFFFFF" padding="32px 24px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827" padding-bottom="8px">
          Refund Processed
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="20px">
          Your refund for order <strong>#{{order.number}}</strong> has been processed. Please allow 5–10 business days for funds to appear.
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box">
          <div class="detail-row"><strong>Order:</strong> <span class="accent">#{{order.number}}</span></div>
          <div class="detail-row"><strong>Status:</strong> <span style="color: #DC2626; font-weight: 600;">Refunded</span></div>
          <div class="detail-row"><strong>Amount:</strong> {{order.total.gross.amount}} {{order.total.gross.currency}}</div>
        </mj-text>
        <mj-text font-size="13px" color="#6B7280" padding-top="16px">
          If you have any questions about this refund, please don't hesitate to contact us.
        </mj-text>
      </mj-column>
    </mj-section>
    ${footerEn}
  </mj-body>
</mjml>`;

const enOrderCancelled = `<mjml>
  ${emailHeadEn}
  <mj-body background-color="#F3F4F6">
    ${headerEn}
    <mj-section background-color="#FFFFFF" padding="32px 24px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827" padding-bottom="8px">
          Order Cancelled
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="20px">
          Your order <strong>#{{order.number}}</strong> has been cancelled. If you did not request this, please contact us immediately.
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box">
          <div class="detail-row"><strong>Order:</strong> <span class="accent">#{{order.number}}</span></div>
          <div class="detail-row"><strong>Status:</strong> <span style="color: #DC2626; font-weight: 600;">Cancelled</span></div>
          <div class="detail-row"><strong>Amount:</strong> {{order.total.gross.amount}} {{order.total.gross.currency}}</div>
        </mj-text>
        <mj-text font-size="13px" color="#6B7280" padding-top="16px">
          If you've already been charged, a refund will be processed within 5–10 business days.
        </mj-text>
      </mj-column>
    </mj-section>
    ${footerEn}
  </mj-body>
</mjml>`;

const enInvoiceSent = `<mjml>
  ${emailHeadEn}
  <mj-body background-color="#F3F4F6">
    ${headerEn}
    <mj-section background-color="#FFFFFF" padding="32px 24px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827" padding-bottom="8px">
          Your Invoice is Ready
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="20px">
          Your invoice for order <strong>#{{order.number}}</strong> is now available for download.
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box">
          <div class="detail-row"><strong>Invoice:</strong> <span class="accent">{{invoice.number}}</span></div>
          <div class="detail-row"><strong>Order:</strong> #{{order.number}}</div>
          <div class="detail-row"><strong>Date:</strong> {{formatDate order.created}}</div>
          <div class="detail-row"><strong>Total:</strong> <span class="accent">{{order.total.gross.amount}} {{order.total.gross.currency}}</span></div>
        </mj-text>
        <mj-button background-color="\${PRIMARY_COLOR}" color="#FFFFFF" border-radius="6px" font-size="15px" font-weight="600" padding="24px 0 16px" inner-padding="12px 28px" href="{{invoice.url}}">
          Download Invoice
        </mj-button>
        <mj-text align="center" font-size="12px" color="#9CA3AF">
          The invoice is also attached to this email.
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#FFFFFF" padding="0 24px 24px">
      <mj-column>
        <mj-text font-size="15px" font-weight="600" color="#111827" padding-bottom="12px">
          Order Summary
        </mj-text>
        ${orderItemsTableEn}
        ${orderTotalsEn}
      </mj-column>
    </mj-section>
    ${footerEn}
  </mj-body>
</mjml>`;

const enGiftCardSent = `<mjml>
  ${emailHeadEn}
  <mj-body background-color="#F3F4F6">
    ${headerEn}
    <mj-section background-color="\${PRIMARY_COLOR}" padding="28px 24px">
      <mj-column>
        <mj-text align="center" font-size="22px" font-weight="700" color="#FFFFFF" padding="0">
          You've Received a Gift Card!
        </mj-text>
        <mj-text align="center" font-size="14px" color="rgba(255,255,255,0.8)" padding="6px 0 0">
          A special gift from \${COMPANY_NAME}
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#FFFFFF" padding="28px 24px">
      <mj-column>
        <mj-text font-size="15px" color="#111827" padding-bottom="20px">
          Use the code below at checkout to redeem your gift card balance.
        </mj-text>
        <mj-text align="center" padding="20px" container-background-color="#F9FAFB" css-class="info-box">
          <div style="font-size: 24px; font-weight: 700; color: \${PRIMARY_COLOR}; letter-spacing: 3px; font-family: 'JetBrains Mono', monospace;">
            {{giftCard.code}}
          </div>
        </mj-text>
        <mj-button background-color="\${PRIMARY_COLOR}" color="#FFFFFF" border-radius="6px" font-size="15px" font-weight="600" padding="24px 0 16px" inner-padding="12px 28px" href="\${COMPANY_WEBSITE}">
          Start Shopping
        </mj-button>
        <mj-text align="center" font-size="12px" color="#9CA3AF">
          Save this email — you'll need the code above to make purchases.
        </mj-text>
      </mj-column>
    </mj-section>
    ${footerEn}
  </mj-body>
</mjml>`;

const enAccountConfirmation = `<mjml>
  ${emailHeadEn}
  <mj-body background-color="#F3F4F6">
    ${headerEn}
    <mj-section background-color="#FFFFFF" padding="32px 24px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827" padding-bottom="8px">
          Welcome to \${COMPANY_NAME}!
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="8px">
          Hi{{#if user.first_name}} {{user.first_name}}{{/if}},
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="20px">
          Thank you for creating an account. Please confirm your email address to get started.
        </mj-text>
        <mj-button background-color="\${PRIMARY_COLOR}" color="#FFFFFF" border-radius="6px" font-size="15px" font-weight="600" padding="8px 0 16px" inner-padding="12px 28px" href="{{confirm_url}}">
          Confirm Email Address
        </mj-button>
        <mj-text align="center" font-size="12px" color="#9CA3AF" padding-top="8px">
          This link expires in 24 hours.
        </mj-text>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="24px 0 16px" />
        <mj-text font-size="13px" color="#6B7280">
          If you didn't create this account, you can safely ignore this email.
        </mj-text>
      </mj-column>
    </mj-section>
    ${footerEn}
  </mj-body>
</mjml>`;

const enAccountPasswordReset = `<mjml>
  ${emailHeadEn}
  <mj-body background-color="#F3F4F6">
    ${headerEn}
    <mj-section background-color="#FFFFFF" padding="32px 24px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827" padding-bottom="8px">
          Password Reset Request
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="8px">
          Hi{{#if user.first_name}} {{user.first_name}}{{/if}},
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="20px">
          We received a request to reset your password. Click the button below to choose a new one.
        </mj-text>
        <mj-button background-color="\${PRIMARY_COLOR}" color="#FFFFFF" border-radius="6px" font-size="15px" font-weight="600" padding="8px 0 16px" inner-padding="12px 28px" href="{{reset_url}}">
          Reset Password
        </mj-button>
        <mj-text align="center" font-size="12px" color="#9CA3AF" padding-top="8px">
          This link expires in 1 hour.
        </mj-text>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="24px 0 16px" />
        <mj-text font-size="13px" color="#DC2626" font-weight="600" padding-bottom="6px">
          Security Notice
        </mj-text>
        <mj-text font-size="13px" color="#6B7280">
          If you didn't request this, please ignore this email. Your password will remain unchanged.
        </mj-text>
      </mj-column>
    </mj-section>
    ${footerEn}
  </mj-body>
</mjml>`;

const enAccountChangeEmailRequest = `<mjml>
  ${emailHeadEn}
  <mj-body background-color="#F3F4F6">
    ${headerEn}
    <mj-section background-color="#FFFFFF" padding="32px 24px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827" padding-bottom="8px">
          Email Change Request
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="8px">
          Hi{{#if user.first_name}} {{user.first_name}}{{/if}},
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="20px">
          We received a request to change your email address. Please confirm to proceed.
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box">
          <div class="detail-row"><strong>New Email:</strong> <span class="accent">{{new_email}}</span></div>
        </mj-text>
        <mj-button background-color="\${PRIMARY_COLOR}" color="#FFFFFF" border-radius="6px" font-size="15px" font-weight="600" padding="24px 0 16px" inner-padding="12px 28px" href="{{redirect_url}}">
          Confirm Email Change
        </mj-button>
        <mj-text align="center" font-size="12px" color="#9CA3AF" padding-top="8px">
          This link expires in 24 hours.
        </mj-text>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="24px 0 16px" />
        <mj-text font-size="13px" color="#6B7280">
          If you didn't request this change, please contact us immediately.
        </mj-text>
      </mj-column>
    </mj-section>
    ${footerEn}
  </mj-body>
</mjml>`;

const enAccountChangeEmailConfirm = `<mjml>
  ${emailHeadEn}
  <mj-body background-color="#F3F4F6">
    ${headerEn}
    <mj-section background-color="#FFFFFF" padding="32px 24px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827" padding-bottom="8px">
          Email Updated Successfully
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="8px">
          Hi{{#if user.first_name}} {{user.first_name}}{{/if}},
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="20px">
          Your email address has been successfully updated. You can now use your new email to log in.
        </mj-text>
        <mj-text align="center" padding="16px" container-background-color="#F0FDF4" css-class="success-box">
          <span style="color: #059669; font-weight: 600; font-size: 15px;">&#10003; Email Successfully Updated</span>
        </mj-text>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="24px 0 16px" />
        <mj-text font-size="13px" color="#6B7280">
          If you didn't make this change, please contact us immediately.
        </mj-text>
      </mj-column>
    </mj-section>
    ${footerEn}
  </mj-body>
</mjml>`;

const enAccountDelete = `<mjml>
  ${emailHeadEn}
  <mj-body background-color="#F3F4F6">
    ${headerEn}
    <mj-section background-color="#FFFFFF" padding="32px 24px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#DC2626" padding-bottom="8px">
          Account Deletion Request
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="8px">
          Hi{{#if user.first_name}} {{user.first_name}}{{/if}},
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="20px">
          We received a request to permanently delete your account. This action cannot be undone.
        </mj-text>
        <mj-text padding="16px" container-background-color="#FEF2F2" css-class="danger-box">
          <div style="color: #DC2626; font-weight: 600; margin-bottom: 8px;">This will permanently delete:</div>
          <ul style="color: #6B7280; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Your account information</li>
            <li>Order history</li>
            <li>Saved addresses</li>
            <li>All personal data</li>
          </ul>
        </mj-text>
        <mj-button background-color="#DC2626" color="#FFFFFF" border-radius="6px" font-size="15px" font-weight="600" padding="24px 0 16px" inner-padding="12px 28px" href="{{delete_url}}">
          Confirm Account Deletion
        </mj-button>
        <mj-text align="center" font-size="12px" color="#9CA3AF" padding-top="8px">
          This link expires in 24 hours.
        </mj-text>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="24px 0 16px" />
        <mj-text font-size="13px" color="#6B7280">
          If you didn't request this, please ignore this email. Your account will remain active.
        </mj-text>
      </mj-column>
    </mj-section>
    ${footerEn}
  </mj-body>
</mjml>`;

const enContactSubmissionReply = `<mjml>
  ${emailHeadEn}
  <mj-body background-color="#F3F4F6">
    ${headerEn}
    <mj-section background-color="#FFFFFF" padding="32px 24px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827" padding-bottom="8px">
          Response to Your Inquiry
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="20px">
          Dear {{submission.name}}, thank you for reaching out. Here's our response:
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box" padding-bottom="16px">
          <div class="detail-row"><strong>Subject:</strong> <span class="accent">{{submission.subject}}</span></div>
          <div class="detail-row"><strong>Submitted:</strong> {{formatDate submission.created_at}}</div>
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#FFFFFF" padding="0 24px 24px">
      <mj-column>
        <mj-text font-size="15px" font-weight="600" color="#111827" padding-bottom="12px">
          Our Response
        </mj-text>
        <mj-text padding="16px" container-background-color="#F0F9FF" css-class="reply-box">
          <div style="white-space: pre-wrap; color: #1F2937; line-height: 1.7;">{{reply_message}}</div>
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#FFFFFF" padding="0 24px 24px">
      <mj-column>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 16px" />
        <mj-text font-size="13px" font-weight="600" color="#6B7280" padding-bottom="8px">
          Your Original Message
        </mj-text>
        <mj-text font-size="13px" color="#9CA3AF" line-height="1.6">
          <div style="white-space: pre-wrap;">{{submission.message}}</div>
        </mj-text>
      </mj-column>
    </mj-section>
    ${footerEn}
  </mj-body>
</mjml>`;

const enNewsletterSubscribe = `<mjml>
  ${emailHeadEn}
  <mj-body background-color="#F3F4F6">
    ${headerEn}
    <mj-section background-color="\${PRIMARY_COLOR}" padding="28px 24px">
      <mj-column>
        <mj-text align="center" font-size="22px" font-weight="700" color="#FFFFFF" padding="0">
          Welcome to Our Newsletter!
        </mj-text>
        <mj-text align="center" font-size="14px" color="rgba(255,255,255,0.8)" padding="6px 0 0">
          Thank you for subscribing
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#FFFFFF" padding="28px 24px">
      <mj-column>
        <mj-text font-size="15px" color="#111827" padding-bottom="8px">
          Hello{{#if user.first_name}} {{user.first_name}}{{/if}},
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="16px">
          Welcome to the \${COMPANY_NAME} newsletter! Here's what you can expect:
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box">
          <div class="detail-row"><strong>Exclusive offers</strong> and special discounts</div>
          <div class="detail-row"><strong>New arrivals</strong> and product launches</div>
          <div class="detail-row"><strong>Early access</strong> to sales and promotions</div>
        </mj-text>
        <mj-button background-color="\${PRIMARY_COLOR}" color="#FFFFFF" border-radius="6px" font-size="15px" font-weight="600" padding="24px 0 8px" inner-padding="12px 28px" href="\${COMPANY_WEBSITE}">
          Start Shopping
        </mj-button>
      </mj-column>
    </mj-section>
    ${footerEn}
  </mj-body>
</mjml>`;

const enNewsletterReactivate = `<mjml>
  ${emailHeadEn}
  <mj-body background-color="#F3F4F6">
    ${headerEn}
    <mj-section background-color="\${PRIMARY_COLOR}" padding="28px 24px">
      <mj-column>
        <mj-text align="center" font-size="22px" font-weight="700" color="#FFFFFF" padding="0">
          Welcome Back!
        </mj-text>
        <mj-text align="center" font-size="14px" color="rgba(255,255,255,0.8)" padding="6px 0 0">
          We've missed you
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#FFFFFF" padding="28px 24px">
      <mj-column>
        <mj-text font-size="15px" color="#111827" padding-bottom="8px">
          Hello{{#if user.first_name}} {{user.first_name}}{{/if}},
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="16px">
          Great to have you back in the \${COMPANY_NAME} community! Here's what you've been missing:
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box">
          <div class="detail-row"><strong>New arrivals</strong> and exciting launches</div>
          <div class="detail-row"><strong>Exclusive discounts</strong> just for subscribers</div>
          <div class="detail-row"><strong>Flash sales</strong> and limited-time offers</div>
        </mj-text>
        <mj-button background-color="\${PRIMARY_COLOR}" color="#FFFFFF" border-radius="6px" font-size="15px" font-weight="600" padding="24px 0 8px" inner-padding="12px 28px" href="\${COMPANY_WEBSITE}">
          See What's New
        </mj-button>
      </mj-column>
    </mj-section>
    ${footerEn}
  </mj-body>
</mjml>`;

// ═══════════════════════════════════════════════════════════════════════════
// HEBREW TEMPLATES (RTL)
// ═══════════════════════════════════════════════════════════════════════════

const heOrderCreated = `<mjml>
  ${emailHeadHe}
  <mj-body background-color="#F3F4F6">
    ${headerHe}
    <mj-section background-color="\${PRIMARY_COLOR}" padding="28px 24px">
      <mj-column>
        <mj-text align="center" font-size="22px" font-weight="700" color="#FFFFFF" padding="0">
          אישור הזמנה
        </mj-text>
        <mj-text align="center" font-size="14px" color="rgba(255,255,255,0.8)" padding="6px 0 0">
          תודה על ההזמנה שלך!
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#FFFFFF" padding="28px 24px">
      <mj-column>
        <mj-text font-size="15px" color="#111827" padding-bottom="16px">
          קיבלנו את הזמנתך ונתחיל לטפל בה בהקדם.
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box">
          <div class="detail-row"><strong>הזמנה:</strong> <span class="accent">#{{order.number}}</span></div>
          <div class="detail-row"><strong>תאריך:</strong> {{formatDate order.created}}</div>
          <div class="detail-row"><strong>סה"כ:</strong> <span class="accent">{{order.total.gross.amount}} {{order.total.gross.currency}}</span></div>
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#FFFFFF" padding="0 24px 24px">
      <mj-column>
        <mj-text font-size="15px" font-weight="600" color="#111827" padding-bottom="12px">
          פריטי ההזמנה
        </mj-text>
        ${orderItemsTableHe}
        ${orderTotalsHe}
      </mj-column>
    </mj-section>
    ${addressBlockHe}
    ${footerHe}
  </mj-body>
</mjml>`;

const heOrderConfirmed = `<mjml>
  ${emailHeadHe}
  <mj-body background-color="#F3F4F6">
    ${headerHe}
    <mj-section background-color="\${PRIMARY_COLOR}" padding="28px 24px">
      <mj-column>
        <mj-text align="center" font-size="22px" font-weight="700" color="#FFFFFF" padding="0">
          ההזמנה אושרה
        </mj-text>
        <mj-text align="center" font-size="14px" color="rgba(255,255,255,0.8)" padding="6px 0 0">
          הזמנה #{{order.number}}
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#FFFFFF" padding="28px 24px">
      <mj-column>
        <mj-text font-size="15px" color="#111827" padding-bottom="16px">
          ההזמנה שלך אושרה ואנחנו מכינים אותה כעת. נעדכן אותך כשהיא תצא לדרך.
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box">
          <div class="detail-row"><strong>הזמנה:</strong> <span class="accent">#{{order.number}}</span></div>
          <div class="detail-row"><strong>סטטוס:</strong> <span style="color: #059669; font-weight: 600;">אושרה</span></div>
          <div class="detail-row"><strong>סה"כ:</strong> {{order.total.gross.amount}} {{order.total.gross.currency}}</div>
        </mj-text>
      </mj-column>
    </mj-section>
    ${addressBlockHe}
    ${footerHe}
  </mj-body>
</mjml>`;

const heOrderFullyPaid = `<mjml>
  ${emailHeadHe}
  <mj-body background-color="#F3F4F6">
    ${headerHe}
    <mj-section background-color="#FFFFFF" padding="32px 24px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827" padding-bottom="8px">
          התשלום התקבל
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="20px">
          התשלום עבור הזמנה <strong>#{{order.number}}</strong> התקבל בהצלחה. תודה!
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box">
          <div class="detail-row"><strong>הזמנה:</strong> <span class="accent">#{{order.number}}</span></div>
          <div class="detail-row"><strong>סטטוס תשלום:</strong> <span style="color: #059669; font-weight: 600;">שולם</span></div>
          <div class="detail-row"><strong>סכום:</strong> <span class="accent">{{order.total.gross.amount}} {{order.total.gross.currency}}</span></div>
        </mj-text>
      </mj-column>
    </mj-section>
    ${addressBlockHe}
    ${footerHe}
  </mj-body>
</mjml>`;

const heOrderFulfilled = `<mjml>
  ${emailHeadHe}
  <mj-body background-color="#F3F4F6">
    ${headerHe}
    <mj-section background-color="\${PRIMARY_COLOR}" padding="28px 24px">
      <mj-column>
        <mj-text align="center" font-size="22px" font-weight="700" color="#FFFFFF" padding="0">
          ההזמנה שלך בדרך אליך
        </mj-text>
        <mj-text align="center" font-size="14px" color="rgba(255,255,255,0.8)" padding="6px 0 0">
          הזמנה #{{order.number}} נשלחה
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#FFFFFF" padding="28px 24px">
      <mj-column>
        <mj-text font-size="15px" color="#111827" padding-bottom="16px">
          חדשות טובות! ההזמנה שלך טופלה ויצאה לדרך.
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box">
          <div class="detail-row"><strong>הזמנה:</strong> <span class="accent">#{{order.number}}</span></div>
          {{#if fulfillment.tracking_number}}
          <div class="detail-row"><strong>מספר מעקב:</strong> <span style="font-family: 'JetBrains Mono', monospace; color: \${PRIMARY_COLOR}; font-weight: 600;">{{fulfillment.tracking_number}}</span></div>
          {{/if}}
          <div class="detail-row"><strong>סטטוס:</strong> <span style="color: #059669; font-weight: 600;">נשלח</span></div>
        </mj-text>
        {{#if fulfillment.tracking_number}}
        <mj-button background-color="\${PRIMARY_COLOR}" color="#FFFFFF" font-size="14px" font-weight="600" border-radius="6px" inner-padding="12px 28px" href="https://t.17track.net/en#nums={{fulfillment.tracking_number}}" padding-top="16px">
          עקוב אחר המשלוח
        </mj-button>
        {{/if}}
      </mj-column>
    </mj-section>
    ${addressBlockHe}
    ${footerHe}
  </mj-body>
</mjml>`;

const heOrderFulfillmentUpdate = `<mjml>
  ${emailHeadHe}
  <mj-body background-color="#F3F4F6">
    ${headerHe}
    <mj-section background-color="#FFFFFF" padding="32px 24px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827" padding-bottom="8px">
          עדכון משלוח
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="20px">
          יש לנו עדכון לגבי המשלוח של הזמנה <strong>#{{order.number}}</strong>.
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box">
          <div class="detail-row"><strong>הזמנה:</strong> <span class="accent">#{{order.number}}</span></div>
          {{#if fulfillment.tracking_number}}
          <div class="detail-row"><strong>מספר מעקב:</strong> <span style="font-family: 'JetBrains Mono', monospace; color: \${PRIMARY_COLOR}; font-weight: 600;">{{fulfillment.tracking_number}}</span></div>
          {{/if}}
          <div class="detail-row"><strong>סטטוס:</strong> <span style="color: #059669; font-weight: 600;">עודכן</span></div>
        </mj-text>
        {{#if fulfillment.tracking_number}}
        <mj-button background-color="\${PRIMARY_COLOR}" color="#FFFFFF" font-size="14px" font-weight="600" border-radius="6px" inner-padding="12px 28px" href="https://t.17track.net/en#nums={{fulfillment.tracking_number}}" padding-top="16px">
          עקוב אחר המשלוח
        </mj-button>
        {{/if}}
      </mj-column>
    </mj-section>
    ${addressBlockForNotifyHe}
    ${footerHe}
  </mj-body>
</mjml>`;

const heOrderRefunded = `<mjml>
  ${emailHeadHe}
  <mj-body background-color="#F3F4F6">
    ${headerHe}
    <mj-section background-color="#FFFFFF" padding="32px 24px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827" padding-bottom="8px">
          ההחזר בוצע
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="20px">
          ההחזר עבור הזמנה <strong>#{{order.number}}</strong> בוצע. אנא המתינו 5–10 ימי עסקים עד שהכספים יופיעו בחשבונכם.
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box">
          <div class="detail-row"><strong>הזמנה:</strong> <span class="accent">#{{order.number}}</span></div>
          <div class="detail-row"><strong>סטטוס:</strong> <span style="color: #DC2626; font-weight: 600;">הוחזר</span></div>
          <div class="detail-row"><strong>סכום:</strong> {{order.total.gross.amount}} {{order.total.gross.currency}}</div>
        </mj-text>
        <mj-text font-size="13px" color="#6B7280" padding-top="16px">
          אם יש לכם שאלות לגבי ההחזר, אל תהססו ליצור איתנו קשר.
        </mj-text>
      </mj-column>
    </mj-section>
    ${footerHe}
  </mj-body>
</mjml>`;

const heOrderCancelled = `<mjml>
  ${emailHeadHe}
  <mj-body background-color="#F3F4F6">
    ${headerHe}
    <mj-section background-color="#FFFFFF" padding="32px 24px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827" padding-bottom="8px">
          ההזמנה בוטלה
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="20px">
          הזמנה <strong>#{{order.number}}</strong> בוטלה. אם לא ביקשתם ביטול זה, אנא צרו קשר מיידית.
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box">
          <div class="detail-row"><strong>הזמנה:</strong> <span class="accent">#{{order.number}}</span></div>
          <div class="detail-row"><strong>סטטוס:</strong> <span style="color: #DC2626; font-weight: 600;">בוטלה</span></div>
          <div class="detail-row"><strong>סכום:</strong> {{order.total.gross.amount}} {{order.total.gross.currency}}</div>
        </mj-text>
        <mj-text font-size="13px" color="#6B7280" padding-top="16px">
          אם כבר חויבתם, ההחזר יבוצע תוך 5–10 ימי עסקים.
        </mj-text>
      </mj-column>
    </mj-section>
    ${footerHe}
  </mj-body>
</mjml>`;

const heInvoiceSent = `<mjml>
  ${emailHeadHe}
  <mj-body background-color="#F3F4F6">
    ${headerHe}
    <mj-section background-color="#FFFFFF" padding="32px 24px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827" padding-bottom="8px">
          החשבונית שלך מוכנה
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="20px">
          החשבונית עבור הזמנה <strong>#{{order.number}}</strong> זמינה להורדה.
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box">
          <div class="detail-row"><strong>חשבונית:</strong> <span class="accent">{{invoice.number}}</span></div>
          <div class="detail-row"><strong>הזמנה:</strong> #{{order.number}}</div>
          <div class="detail-row"><strong>תאריך:</strong> {{formatDate order.created}}</div>
          <div class="detail-row"><strong>סה"כ:</strong> <span class="accent">{{order.total.gross.amount}} {{order.total.gross.currency}}</span></div>
        </mj-text>
        <mj-button background-color="\${PRIMARY_COLOR}" color="#FFFFFF" border-radius="6px" font-size="15px" font-weight="600" padding="24px 0 16px" inner-padding="12px 28px" href="{{invoice.url}}">
          הורד חשבונית
        </mj-button>
        <mj-text align="center" font-size="12px" color="#9CA3AF">
          החשבונית גם מצורפת למייל זה.
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#FFFFFF" padding="0 24px 24px">
      <mj-column>
        <mj-text font-size="15px" font-weight="600" color="#111827" padding-bottom="12px">
          סיכום הזמנה
        </mj-text>
        ${orderItemsTableHe}
        ${orderTotalsHe}
      </mj-column>
    </mj-section>
    ${footerHe}
  </mj-body>
</mjml>`;

const heGiftCardSent = `<mjml>
  ${emailHeadHe}
  <mj-body background-color="#F3F4F6">
    ${headerHe}
    <mj-section background-color="\${PRIMARY_COLOR}" padding="28px 24px">
      <mj-column>
        <mj-text align="center" font-size="22px" font-weight="700" color="#FFFFFF" padding="0">
          קיבלת כרטיס מתנה!
        </mj-text>
        <mj-text align="center" font-size="14px" color="rgba(255,255,255,0.8)" padding="6px 0 0">
          מתנה מיוחדת מ-\${COMPANY_NAME}
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#FFFFFF" padding="28px 24px">
      <mj-column>
        <mj-text font-size="15px" color="#111827" padding-bottom="20px">
          השתמשו בקוד הבא בקופה כדי לממש את יתרת כרטיס המתנה.
        </mj-text>
        <mj-text align="center" padding="20px" container-background-color="#F9FAFB" css-class="info-box">
          <div style="font-size: 24px; font-weight: 700; color: \${PRIMARY_COLOR}; letter-spacing: 3px; font-family: 'JetBrains Mono', monospace;">
            {{giftCard.code}}
          </div>
        </mj-text>
        <mj-button background-color="\${PRIMARY_COLOR}" color="#FFFFFF" border-radius="6px" font-size="15px" font-weight="600" padding="24px 0 16px" inner-padding="12px 28px" href="\${COMPANY_WEBSITE}">
          התחילו לקנות
        </mj-button>
        <mj-text align="center" font-size="12px" color="#9CA3AF">
          שמרו מייל זה — תצטרכו את הקוד לביצוע רכישות.
        </mj-text>
      </mj-column>
    </mj-section>
    ${footerHe}
  </mj-body>
</mjml>`;

const heAccountConfirmation = `<mjml>
  ${emailHeadHe}
  <mj-body background-color="#F3F4F6">
    ${headerHe}
    <mj-section background-color="#FFFFFF" padding="32px 24px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827" padding-bottom="8px">
          ברוכים הבאים ל-\${COMPANY_NAME}!
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="8px">
          שלום{{#if user.first_name}} {{user.first_name}}{{/if}},
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="20px">
          תודה שנרשמת. אנא אשרו את כתובת המייל שלכם כדי להתחיל.
        </mj-text>
        <mj-button background-color="\${PRIMARY_COLOR}" color="#FFFFFF" border-radius="6px" font-size="15px" font-weight="600" padding="8px 0 16px" inner-padding="12px 28px" href="{{confirm_url}}">
          אשר כתובת מייל
        </mj-button>
        <mj-text align="center" font-size="12px" color="#9CA3AF" padding-top="8px">
          הקישור תקף ל-24 שעות.
        </mj-text>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="24px 0 16px" />
        <mj-text font-size="13px" color="#6B7280">
          אם לא יצרתם חשבון זה, ניתן להתעלם ממייל זה.
        </mj-text>
      </mj-column>
    </mj-section>
    ${footerHe}
  </mj-body>
</mjml>`;

const heAccountPasswordReset = `<mjml>
  ${emailHeadHe}
  <mj-body background-color="#F3F4F6">
    ${headerHe}
    <mj-section background-color="#FFFFFF" padding="32px 24px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827" padding-bottom="8px">
          בקשה לאיפוס סיסמה
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="8px">
          שלום{{#if user.first_name}} {{user.first_name}}{{/if}},
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="20px">
          קיבלנו בקשה לאפס את הסיסמה שלכם. לחצו על הכפתור למטה כדי לבחור סיסמה חדשה.
        </mj-text>
        <mj-button background-color="\${PRIMARY_COLOR}" color="#FFFFFF" border-radius="6px" font-size="15px" font-weight="600" padding="8px 0 16px" inner-padding="12px 28px" href="{{reset_url}}">
          איפוס סיסמה
        </mj-button>
        <mj-text align="center" font-size="12px" color="#9CA3AF" padding-top="8px">
          הקישור תקף לשעה אחת.
        </mj-text>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="24px 0 16px" />
        <mj-text font-size="13px" color="#DC2626" font-weight="600" padding-bottom="6px">
          הודעת אבטחה
        </mj-text>
        <mj-text font-size="13px" color="#6B7280">
          אם לא ביקשתם איפוס, התעלמו ממייל זה. הסיסמה שלכם לא תשתנה.
        </mj-text>
      </mj-column>
    </mj-section>
    ${footerHe}
  </mj-body>
</mjml>`;

const heAccountChangeEmailRequest = `<mjml>
  ${emailHeadHe}
  <mj-body background-color="#F3F4F6">
    ${headerHe}
    <mj-section background-color="#FFFFFF" padding="32px 24px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827" padding-bottom="8px">
          בקשה לשינוי מייל
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="8px">
          שלום{{#if user.first_name}} {{user.first_name}}{{/if}},
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="20px">
          קיבלנו בקשה לשנות את כתובת המייל שלכם. אנא אשרו כדי להמשיך.
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box">
          <div class="detail-row"><strong>מייל חדש:</strong> <span class="accent">{{new_email}}</span></div>
        </mj-text>
        <mj-button background-color="\${PRIMARY_COLOR}" color="#FFFFFF" border-radius="6px" font-size="15px" font-weight="600" padding="24px 0 16px" inner-padding="12px 28px" href="{{redirect_url}}">
          אשר שינוי מייל
        </mj-button>
        <mj-text align="center" font-size="12px" color="#9CA3AF" padding-top="8px">
          הקישור תקף ל-24 שעות.
        </mj-text>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="24px 0 16px" />
        <mj-text font-size="13px" color="#6B7280">
          אם לא ביקשתם שינוי זה, אנא צרו קשר מיידית.
        </mj-text>
      </mj-column>
    </mj-section>
    ${footerHe}
  </mj-body>
</mjml>`;

const heAccountChangeEmailConfirm = `<mjml>
  ${emailHeadHe}
  <mj-body background-color="#F3F4F6">
    ${headerHe}
    <mj-section background-color="#FFFFFF" padding="32px 24px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827" padding-bottom="8px">
          המייל עודכן בהצלחה
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="8px">
          שלום{{#if user.first_name}} {{user.first_name}}{{/if}},
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="20px">
          כתובת המייל שלכם עודכנה בהצלחה. כעת ניתן להשתמש במייל החדש להתחברות.
        </mj-text>
        <mj-text align="center" padding="16px" container-background-color="#F0FDF4" css-class="success-box">
          <span style="color: #059669; font-weight: 600; font-size: 15px;">&#10003; המייל עודכן בהצלחה</span>
        </mj-text>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="24px 0 16px" />
        <mj-text font-size="13px" color="#6B7280">
          אם לא ביצעתם שינוי זה, אנא צרו קשר מיידית.
        </mj-text>
      </mj-column>
    </mj-section>
    ${footerHe}
  </mj-body>
</mjml>`;

const heAccountDelete = `<mjml>
  ${emailHeadHe}
  <mj-body background-color="#F3F4F6">
    ${headerHe}
    <mj-section background-color="#FFFFFF" padding="32px 24px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#DC2626" padding-bottom="8px">
          בקשה למחיקת חשבון
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="8px">
          שלום{{#if user.first_name}} {{user.first_name}}{{/if}},
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="20px">
          קיבלנו בקשה למחוק את החשבון שלכם לצמיתות. פעולה זו אינה ניתנת לביטול.
        </mj-text>
        <mj-text padding="16px" container-background-color="#FEF2F2" css-class="danger-box">
          <div style="color: #DC2626; font-weight: 600; margin-bottom: 8px;">פעולה זו תמחק לצמיתות:</div>
          <ul style="color: #6B7280; margin: 0; padding-right: 20px; padding-left: 0; line-height: 1.8; list-style-position: inside;">
            <li>פרטי החשבון שלכם</li>
            <li>היסטוריית הזמנות</li>
            <li>כתובות שמורות</li>
            <li>כל המידע האישי</li>
          </ul>
        </mj-text>
        <mj-button background-color="#DC2626" color="#FFFFFF" border-radius="6px" font-size="15px" font-weight="600" padding="24px 0 16px" inner-padding="12px 28px" href="{{delete_url}}">
          אשר מחיקת חשבון
        </mj-button>
        <mj-text align="center" font-size="12px" color="#9CA3AF" padding-top="8px">
          הקישור תקף ל-24 שעות.
        </mj-text>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="24px 0 16px" />
        <mj-text font-size="13px" color="#6B7280">
          אם לא ביקשתם זאת, התעלמו ממייל זה. החשבון שלכם יישאר פעיל.
        </mj-text>
      </mj-column>
    </mj-section>
    ${footerHe}
  </mj-body>
</mjml>`;

const heContactSubmissionReply = `<mjml>
  ${emailHeadHe}
  <mj-body background-color="#F3F4F6">
    ${headerHe}
    <mj-section background-color="#FFFFFF" padding="32px 24px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827" padding-bottom="8px">
          תשובה לפנייתך
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="20px">
          {{submission.name}} יקר/ה, תודה שפנית אלינו. הנה התשובה שלנו:
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box" padding-bottom="16px">
          <div class="detail-row"><strong>נושא:</strong> <span class="accent">{{submission.subject}}</span></div>
          <div class="detail-row"><strong>תאריך:</strong> {{formatDate submission.created_at}}</div>
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#FFFFFF" padding="0 24px 24px">
      <mj-column>
        <mj-text font-size="15px" font-weight="600" color="#111827" padding-bottom="12px">
          התשובה שלנו
        </mj-text>
        <mj-text padding="16px" container-background-color="#F0F9FF" css-class="reply-box">
          <div style="white-space: pre-wrap; color: #1F2937; line-height: 1.7;">{{reply_message}}</div>
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#FFFFFF" padding="0 24px 24px">
      <mj-column>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 16px" />
        <mj-text font-size="13px" font-weight="600" color="#6B7280" padding-bottom="8px">
          ההודעה המקורית שלך
        </mj-text>
        <mj-text font-size="13px" color="#9CA3AF" line-height="1.6">
          <div style="white-space: pre-wrap;">{{submission.message}}</div>
        </mj-text>
      </mj-column>
    </mj-section>
    ${footerHe}
  </mj-body>
</mjml>`;

const heNewsletterSubscribe = `<mjml>
  ${emailHeadHe}
  <mj-body background-color="#F3F4F6">
    ${headerHe}
    <mj-section background-color="\${PRIMARY_COLOR}" padding="28px 24px">
      <mj-column>
        <mj-text align="center" font-size="22px" font-weight="700" color="#FFFFFF" padding="0">
          ברוכים הבאים לניוזלטר!
        </mj-text>
        <mj-text align="center" font-size="14px" color="rgba(255,255,255,0.8)" padding="6px 0 0">
          תודה שנרשמתם
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#FFFFFF" padding="28px 24px">
      <mj-column>
        <mj-text font-size="15px" color="#111827" padding-bottom="8px">
          שלום{{#if user.first_name}} {{user.first_name}}{{/if}},
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="16px">
          ברוכים הבאים לניוזלטר של \${COMPANY_NAME}! הנה מה שמחכה לכם:
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box">
          <div class="detail-row"><strong>הצעות בלעדיות</strong> והנחות מיוחדות</div>
          <div class="detail-row"><strong>מוצרים חדשים</strong> והשקות</div>
          <div class="detail-row"><strong>גישה מוקדמת</strong> למבצעים</div>
        </mj-text>
        <mj-button background-color="\${PRIMARY_COLOR}" color="#FFFFFF" border-radius="6px" font-size="15px" font-weight="600" padding="24px 0 8px" inner-padding="12px 28px" href="\${COMPANY_WEBSITE}">
          התחילו לקנות
        </mj-button>
      </mj-column>
    </mj-section>
    ${footerHe}
  </mj-body>
</mjml>`;

const heNewsletterReactivate = `<mjml>
  ${emailHeadHe}
  <mj-body background-color="#F3F4F6">
    ${headerHe}
    <mj-section background-color="\${PRIMARY_COLOR}" padding="28px 24px">
      <mj-column>
        <mj-text align="center" font-size="22px" font-weight="700" color="#FFFFFF" padding="0">
          ברוכים השבים!
        </mj-text>
        <mj-text align="center" font-size="14px" color="rgba(255,255,255,0.8)" padding="6px 0 0">
          התגעגענו אליכם
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#FFFFFF" padding="28px 24px">
      <mj-column>
        <mj-text font-size="15px" color="#111827" padding-bottom="8px">
          שלום{{#if user.first_name}} {{user.first_name}}{{/if}},
        </mj-text>
        <mj-text font-size="15px" color="#374151" padding-bottom="16px">
          שמחים שחזרתם לקהילת \${COMPANY_NAME}! הנה מה שפיספסתם:
        </mj-text>
        <mj-text padding="16px" container-background-color="#F9FAFB" css-class="info-box">
          <div class="detail-row"><strong>מוצרים חדשים</strong> והשקות מרגשות</div>
          <div class="detail-row"><strong>הנחות בלעדיות</strong> למנויים בלבד</div>
          <div class="detail-row"><strong>מבצעי בזק</strong> והצעות מוגבלות</div>
        </mj-text>
        <mj-button background-color="\${PRIMARY_COLOR}" color="#FFFFFF" border-radius="6px" font-size="15px" font-weight="600" padding="24px 0 8px" inner-padding="12px 28px" href="\${COMPANY_WEBSITE}">
          ראו מה חדש
        </mj-button>
      </mj-column>
    </mj-section>
    ${footerHe}
  </mj-body>
</mjml>`;

// ─── Abandoned Checkout Templates ─────────────────────────────────────────

const cartItemsTableEn = `
        <mj-table padding="0" cellpadding="0">
          <thead>
            <tr style="border-bottom: 2px solid #E5E7EB;">
              <th style="text-align: left; padding: 10px 0; font-size: 11px; text-transform: uppercase; color: #6B7280; font-weight: 600; letter-spacing: 0.05em;">Item</th>
              <th style="text-align: center; padding: 10px 0; font-size: 11px; text-transform: uppercase; color: #6B7280; font-weight: 600; letter-spacing: 0.05em;">Qty</th>
              <th style="text-align: right; padding: 10px 0; font-size: 11px; text-transform: uppercase; color: #6B7280; font-weight: 600; letter-spacing: 0.05em;">Price</th>
            </tr>
          </thead>
          <tbody>
            {{#each lines}}
            <tr style="border-bottom: 1px solid #F3F4F6;">
              <td style="padding: 12px 0; color: #374151; font-size: 14px;">{{this.product_name}}{{#if this.variant_name}} — {{this.variant_name}}{{/if}}</td>
              <td style="text-align: center; padding: 12px 0; color: #6B7280; font-size: 14px;">{{this.quantity}}</td>
              <td style="text-align: right; padding: 12px 0; color: #374151; font-weight: 500; font-size: 14px;">{{this.total_gross_amount}} {{this.currency}}</td>
            </tr>
            {{/each}}
          </tbody>
        </mj-table>`;

const cartTotalsEn = `
        <mj-table padding="12px 0 0 0">
          <tbody>
            <tr style="border-top: 2px solid #E5E7EB;">
              <td style="text-align: right; padding: 14px 0 0 0; color: #111827; font-size: 16px; font-weight: 700;">Total:</td>
              <td style="text-align: right; padding: 14px 0 0 16px; color: \${PRIMARY_COLOR}; font-size: 16px; font-weight: 700; width: 120px;">{{total_gross_amount}} {{currency}}</td>
            </tr>
          </tbody>
        </mj-table>`;

const enAbandonedCheckout = `<mjml>
  ${emailHeadEn}
  <mj-body background-color="#F9FAFB">
    ${headerEn}

    <mj-section background-color="#FFFFFF" padding="32px 24px 16px">
      <mj-column>
        <mj-text font-size="22px" font-weight="700" color="#111827" padding-bottom="8px">
          {{#eq email_number 1}}You left something behind!{{/eq}}{{#eq email_number 2}}Your cart is waiting for you{{/eq}}{{#eq email_number 3}}Last chance — your items may sell out{{/eq}}
        </mj-text>
        <mj-text color="#6B7280" padding-bottom="4px">
          {{#eq email_number 1}}It looks like you didn't finish checking out. No worries — your items are still saved.{{/eq}}{{#eq email_number 2}}We noticed you left some great items in your cart. They're still waiting for you!{{/eq}}{{#eq email_number 3}}Your cart items are selling fast and we can't guarantee they'll stay in stock. Complete your order before it's too late!{{/eq}}
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section background-color="#FFFFFF" padding="0 24px 16px">
      <mj-column>
        ${cartItemsTableEn}
        ${cartTotalsEn}
      </mj-column>
    </mj-section>

    <mj-section background-color="#FFFFFF" padding="8px 24px 32px">
      <mj-column>
        <mj-button background-color="\${PRIMARY_COLOR}" color="#FFFFFF" border-radius="6px" font-size="16px" font-weight="600" inner-padding="14px 36px" href="{{recover_url}}">
          {{#eq email_number 1}}Complete Your Order{{/eq}}{{#eq email_number 2}}Return to Your Cart{{/eq}}{{#eq email_number 3}}Complete Purchase Now{{/eq}}
        </mj-button>
      </mj-column>
    </mj-section>

    ${footerEn}
  </mj-body>
</mjml>`;

const cartItemsTableHe = `
        <mj-table padding="0" cellpadding="0">
          <thead>
            <tr style="border-bottom: 2px solid #E5E7EB;">
              <th style="text-align: right; padding: 10px 0; font-size: 11px; text-transform: uppercase; color: #6B7280; font-weight: 600; letter-spacing: 0.05em;">פריט</th>
              <th style="text-align: center; padding: 10px 0; font-size: 11px; text-transform: uppercase; color: #6B7280; font-weight: 600; letter-spacing: 0.05em;">כמות</th>
              <th style="text-align: left; padding: 10px 0; font-size: 11px; text-transform: uppercase; color: #6B7280; font-weight: 600; letter-spacing: 0.05em;">מחיר</th>
            </tr>
          </thead>
          <tbody>
            {{#each lines}}
            <tr style="border-bottom: 1px solid #F3F4F6;">
              <td style="padding: 12px 0; color: #374151; font-size: 14px; text-align: right;">{{this.product_name}}{{#if this.variant_name}} — {{this.variant_name}}{{/if}}</td>
              <td style="text-align: center; padding: 12px 0; color: #6B7280; font-size: 14px;">{{this.quantity}}</td>
              <td style="text-align: left; padding: 12px 0; color: #374151; font-weight: 500; font-size: 14px;">{{this.total_gross_amount}} {{this.currency}}</td>
            </tr>
            {{/each}}
          </tbody>
        </mj-table>`;

const cartTotalsHe = `
        <mj-table padding="12px 0 0 0">
          <tbody>
            <tr style="border-top: 2px solid #E5E7EB;">
              <td style="text-align: left; padding: 14px 0 0 0; color: #111827; font-size: 16px; font-weight: 700;">סה"כ:</td>
              <td style="text-align: left; padding: 14px 16px 0 0; color: \${PRIMARY_COLOR}; font-size: 16px; font-weight: 700; width: 120px;">{{total_gross_amount}} {{currency}}</td>
            </tr>
          </tbody>
        </mj-table>`;

const heAbandonedCheckout = `<mjml>
  ${emailHeadHe}
  <mj-body background-color="#F9FAFB">
    ${headerHe}

    <mj-section background-color="#FFFFFF" padding="32px 24px 16px">
      <mj-column>
        <mj-text font-size="22px" font-weight="700" color="#111827" padding-bottom="8px" align="right">
          {{#eq email_number 1}}שכחת משהו!{{/eq}}{{#eq email_number 2}}העגלה שלך מחכה לך{{/eq}}{{#eq email_number 3}}הזדמנות אחרונה — המוצרים עלולים לאזול{{/eq}}
        </mj-text>
        <mj-text color="#6B7280" padding-bottom="4px" align="right">
          {{#eq email_number 1}}נראה שלא סיימת את ההזמנה. אל דאגה — הפריטים שלך עדיין שמורים.{{/eq}}{{#eq email_number 2}}שמנו לב שהשארת פריטים מעולים בעגלה. הם עדיין מחכים לך!{{/eq}}{{#eq email_number 3}}הפריטים בעגלה שלך נמכרים מהר ואנחנו לא יכולים להבטיח שיישארו במלאי. השלימו את ההזמנה לפני שיהיה מאוחר!{{/eq}}
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section background-color="#FFFFFF" padding="0 24px 16px">
      <mj-column>
        ${cartItemsTableHe}
        ${cartTotalsHe}
      </mj-column>
    </mj-section>

    <mj-section background-color="#FFFFFF" padding="8px 24px 32px">
      <mj-column>
        <mj-button background-color="\${PRIMARY_COLOR}" color="#FFFFFF" border-radius="6px" font-size="16px" font-weight="600" inner-padding="14px 36px" href="{{recover_url}}">
          {{#eq email_number 1}}השלימו את ההזמנה{{/eq}}{{#eq email_number 2}}חזרו לעגלה{{/eq}}{{#eq email_number 3}}השלימו רכישה עכשיו{{/eq}}
        </mj-button>
      </mj-column>
    </mj-section>

    ${footerHe}
  </mj-body>
</mjml>`;

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const defaultMjmlTemplates: Record<MessageEventTypes, string> = {
  ABANDONED_CHECKOUT: enAbandonedCheckout,
  ACCOUNT_CHANGE_EMAIL_CONFIRM: enAccountChangeEmailConfirm,
  ACCOUNT_CHANGE_EMAIL_REQUEST: enAccountChangeEmailRequest,
  ACCOUNT_CONFIRMATION: enAccountConfirmation,
  ACCOUNT_DELETE: enAccountDelete,
  ACCOUNT_PASSWORD_RESET: enAccountPasswordReset,
  CONTACT_SUBMISSION_REPLY: enContactSubmissionReply,
  GIFT_CARD_SENT: enGiftCardSent,
  INVOICE_SENT: enInvoiceSent,
  NEWSLETTER_SUBSCRIBE: enNewsletterSubscribe,
  NEWSLETTER_REACTIVATE: enNewsletterReactivate,
  ORDER_CANCELLED: enOrderCancelled,
  ORDER_CONFIRMED: enOrderConfirmed,
  ORDER_CREATED: enOrderCreated,
  ORDER_FULFILLED: enOrderFulfilled,
  ORDER_FULFILLMENT_UPDATE: enOrderFulfillmentUpdate,
  ORDER_FULLY_PAID: enOrderFullyPaid,
  ORDER_REFUNDED: enOrderRefunded,
};

export const defaultMjmlSubjectTemplates: Record<MessageEventTypes, string> = {
  ABANDONED_CHECKOUT: `{{#eq email_number 1}}You left something behind!{{/eq}}{{#eq email_number 2}}Your cart is waiting for you{{/eq}}{{#eq email_number 3}}Last chance — don't miss out!{{/eq}} — \${COMPANY_NAME}`,
  ACCOUNT_CHANGE_EMAIL_CONFIRM: `Email Updated Successfully — \${COMPANY_NAME}`,
  ACCOUNT_CHANGE_EMAIL_REQUEST: `Confirm Your New Email Address — \${COMPANY_NAME}`,
  ACCOUNT_CONFIRMATION: `Welcome to \${COMPANY_NAME} — Confirm Your Email`,
  ACCOUNT_DELETE: `Account Deletion Request — \${COMPANY_NAME}`,
  ACCOUNT_PASSWORD_RESET: `🔑 Password Reset Request — \${COMPANY_NAME}`,
  CONTACT_SUBMISSION_REPLY: `{{#if reply_subject}}{{reply_subject}}{{else}}Re: {{submission.subject}}{{/if}} — \${COMPANY_NAME}`,
  GIFT_CARD_SENT: `🎁 Your Gift Card Has Arrived — \${COMPANY_NAME}`,
  INVOICE_SENT: `Invoice #{{invoice.number}} for Order #{{order.number}} — \${COMPANY_NAME}`,
  NEWSLETTER_SUBSCRIBE: `Welcome to \${COMPANY_NAME} Newsletter!`,
  NEWSLETTER_REACTIVATE: `Welcome Back to \${COMPANY_NAME}!`,
  ORDER_CANCELLED: `Order #{{order.number}} Cancelled — \${COMPANY_NAME}`,
  ORDER_CONFIRMED: `📦 Order #{{order.number}} Confirmed — \${COMPANY_NAME}`,
  ORDER_CREATED: `Order #{{order.number}} Received — \${COMPANY_NAME}`,
  ORDER_FULFILLED: `📦 Order #{{order.number}} Shipped — \${COMPANY_NAME}`,
  ORDER_FULFILLMENT_UPDATE: `Shipment Update for Order #{{order.number}} — \${COMPANY_NAME}`,
  ORDER_FULLY_PAID: `Payment Received for Order #{{order.number}} — \${COMPANY_NAME}`,
  ORDER_REFUNDED: `Refund Processed for Order #{{order.number}} — \${COMPANY_NAME}`,
};

// ─── Hebrew Templates ───────────────────────────────────────────────────────

export const defaultMjmlTemplatesHe: Record<MessageEventTypes, string> = {
  ABANDONED_CHECKOUT: heAbandonedCheckout,
  ACCOUNT_CHANGE_EMAIL_CONFIRM: heAccountChangeEmailConfirm,
  ACCOUNT_CHANGE_EMAIL_REQUEST: heAccountChangeEmailRequest,
  ACCOUNT_CONFIRMATION: heAccountConfirmation,
  ACCOUNT_DELETE: heAccountDelete,
  ACCOUNT_PASSWORD_RESET: heAccountPasswordReset,
  CONTACT_SUBMISSION_REPLY: heContactSubmissionReply,
  GIFT_CARD_SENT: heGiftCardSent,
  INVOICE_SENT: heInvoiceSent,
  NEWSLETTER_SUBSCRIBE: heNewsletterSubscribe,
  NEWSLETTER_REACTIVATE: heNewsletterReactivate,
  ORDER_CANCELLED: heOrderCancelled,
  ORDER_CONFIRMED: heOrderConfirmed,
  ORDER_CREATED: heOrderCreated,
  ORDER_FULFILLED: heOrderFulfilled,
  ORDER_FULFILLMENT_UPDATE: heOrderFulfillmentUpdate,
  ORDER_FULLY_PAID: heOrderFullyPaid,
  ORDER_REFUNDED: heOrderRefunded,
};

export const defaultMjmlSubjectTemplatesHe: Record<MessageEventTypes, string> = {
  ABANDONED_CHECKOUT: `{{#eq email_number 1}}שכחת משהו!{{/eq}}{{#eq email_number 2}}העגלה שלך מחכה לך{{/eq}}{{#eq email_number 3}}הזדמנות אחרונה — אל תפספסו!{{/eq}} — \${COMPANY_NAME}`,
  ACCOUNT_CHANGE_EMAIL_CONFIRM: `המייל עודכן בהצלחה — \${COMPANY_NAME}`,
  ACCOUNT_CHANGE_EMAIL_REQUEST: `אשרו את כתובת המייל החדשה — \${COMPANY_NAME}`,
  ACCOUNT_CONFIRMATION: `ברוכים הבאים ל-\${COMPANY_NAME} — אשרו את המייל`,
  ACCOUNT_DELETE: `בקשה למחיקת חשבון — \${COMPANY_NAME}`,
  ACCOUNT_PASSWORD_RESET: `🔑 בקשה לאיפוס סיסמה — \${COMPANY_NAME}`,
  CONTACT_SUBMISSION_REPLY: `{{#if reply_subject}}{{reply_subject}}{{else}}תשובה: {{submission.subject}}{{/if}} — \${COMPANY_NAME}`,
  GIFT_CARD_SENT: `🎁 כרטיס המתנה שלך הגיע — \${COMPANY_NAME}`,
  INVOICE_SENT: `חשבונית #{{invoice.number}} עבור הזמנה #{{order.number}} — \${COMPANY_NAME}`,
  NEWSLETTER_SUBSCRIBE: `ברוכים הבאים לניוזלטר של \${COMPANY_NAME}!`,
  NEWSLETTER_REACTIVATE: `ברוכים השבים ל-\${COMPANY_NAME}!`,
  ORDER_CANCELLED: `הזמנה #{{order.number}} בוטלה — \${COMPANY_NAME}`,
  ORDER_CONFIRMED: `📦 הזמנה #{{order.number}} אושרה — \${COMPANY_NAME}`,
  ORDER_CREATED: `הזמנה #{{order.number}} התקבלה — \${COMPANY_NAME}`,
  ORDER_FULFILLED: `📦 הזמנה #{{order.number}} נשלחה — \${COMPANY_NAME}`,
  ORDER_FULFILLMENT_UPDATE: `עדכון משלוח להזמנה #{{order.number}} — \${COMPANY_NAME}`,
  ORDER_FULLY_PAID: `התשלום התקבל להזמנה #{{order.number}} — \${COMPANY_NAME}`,
  ORDER_REFUNDED: `החזר בוצע להזמנה #{{order.number}} — \${COMPANY_NAME}`,
};

// ─── Language Selector Helper ────────────────────────────────────────────────

export const getDefaultTemplates = (lang: TemplateLanguage) => ({
  templates: lang === "he" ? defaultMjmlTemplatesHe : defaultMjmlTemplates,
  subjects: lang === "he" ? defaultMjmlSubjectTemplatesHe : defaultMjmlSubjectTemplates,
});
