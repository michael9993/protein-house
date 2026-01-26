import { MessageEventTypes } from "../event-handlers/message-event-types";

// ============================================================================
// 🎨 COMPANY BRANDING - CUSTOMIZE HERE
// ============================================================================
const COMPANY_NAME = "Shoe Vault";
const COMPANY_EMAIL = "support@shoevault.com";
const COMPANY_WEBSITE = "www.shoevault.com";
const PRIMARY_COLOR = "#2563EB"; // Professional Blue
const SECONDARY_COLOR = "#1F2937"; // Dark Gray
// ============================================================================

// Common styles for all emails
const emailStyles = `
  <mj-attributes>
    <mj-all font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" />
    <mj-text font-size="14px" color="#374151" line-height="1.6" />
    <mj-section padding="20px 0" />
  </mj-attributes>
  <mj-style inline="inline">
    .info-box { background-color: #F9FAFB; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .highlight { color: ${PRIMARY_COLOR}; font-weight: 600; }
    .order-detail { padding: 8px 0; border-bottom: 1px solid #E5E7EB; }
    .order-detail:last-child { border-bottom: none; }
    .reply-box { background-color: #F0F9FF; border-left: 4px solid ${PRIMARY_COLOR}; border-radius: 8px; padding: 20px; margin: 20px 0; }
  </mj-style>
`;

const addressSection = `<mj-section>
  <mj-column>
    <mj-table>
      <thead>
        <tr>
          <th>
            Billing address
          </th>
          <th>
            Shipping address
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            {{#if order.billingAddress}}
              {{ order.billingAddress.streetAddress1 }}
            {{else}}
              No billing address
            {{/if}}
          </td>
          <td>
            {{#if order.shippingAddress}}
              {{ order.shippingAddress.streetAddress1}}
            {{else}}
              No shipping required
            {{/if}}
          </td>
        </tr>
      </tbody>
    </mj-table>
  </mj-column>
</mj-section>
`;

const addressSectionForNotify = `<mj-section>
  <mj-column>
    <mj-table>
      <thead>
        <tr>
          <th>
            Billing address
          </th>
          <th>
            Shipping address
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            {{#if order.billing_address}}
              {{ order.billing_address.street_address_1 }}
            {{else}}
              No billing address
            {{/if}}
          </td>
          <td>
            {{#if order.shipping_address}}
              {{ order.shipping_address.street_address_1}}
            {{else}}
              No shipping required
            {{/if}}
          </td>
        </tr>
      </tbody>
    </mj-table>
  </mj-column>
</mj-section>
`;

const orderLinesSection = `<mj-section>
  <mj-column>
    <mj-table>
      <tbody>
        {{#each order.lines }}
          <tr>
            <td>
              {{ this.quantity }} x {{ this.productName }} - {{ this.variantName }}
            </td>
            <td align="right">
              {{ this.totalPrice.gross.amount }} {{ this.totalPrice.gross.currency }}
            </td>
          </tr>
        {{/each}}
        <tr>
          <td>
          </td>
          <td align="right">
            Shipping: {{ order.shippingPrice.gross.amount }} {{ order.shippingPrice.gross.currency }}
          </td>
        </tr>
        <tr>
          <td>
          </td>
          <td align="right">
            Total: {{ order.total.gross.amount }} {{ order.total.gross.currency }}
          </td>
        </tr>
      </tbody>
    </mj-table>
  </mj-column>
</mj-section>
`;

const defaultOrderCreatedMjmlTemplate = `<mjml>
  <mj-head>
    ${emailStyles}
  </mj-head>
  <mj-body background-color="#F3F4F6">
    <!-- Header -->
    <mj-section background-color="${PRIMARY_COLOR}" padding="40px 0">
      <mj-column>
        <mj-text align="center" font-size="28px" font-weight="bold" color="#FFFFFF" padding-bottom="10px">
          Order Confirmation
        </mj-text>
        <mj-text align="center" font-size="16px" color="#DBEAFE">
          Thank you for your order!
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Main Content -->
    <mj-section background-color="#FFFFFF" padding="30px 25px">
      <mj-column>
        <mj-text font-size="18px" color="#1F2937" padding-bottom="15px">
          Hello! 👋
        </mj-text>
        <mj-text>
          Thank you for your order! We've received it and will process it shortly.
        </mj-text>
        
        <!-- Order Details Box -->
        <mj-text css-class="info-box" padding-top="25px" padding-bottom="10px">
          <div class="order-detail">
            <strong>Order Number:</strong> <span class="highlight">#{{order.number}}</span>
          </div>
          <div class="order-detail">
            <strong>Order Date:</strong> {{formatDate order.created}}
          </div>
          <div class="order-detail">
            <strong>Total Amount:</strong> <span class="highlight">{{order.total.gross.amount}} {{order.total.gross.currency}}</span>
          </div>
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Order Items -->
    <mj-section background-color="#FFFFFF" padding="25px" padding-top="15px">
      <mj-column>
        <mj-text font-size="16px" font-weight="600" color="#1F2937" padding-bottom="15px">
          Order Items
        </mj-text>
        <mj-table>
          <thead>
            <tr style="border-bottom: 2px solid #E5E7EB;">
              <th style="text-align: left; padding: 10px 0; font-size: 12px; color: #6B7280; font-weight: 600;">ITEM</th>
              <th style="text-align: center; padding: 10px 0; font-size: 12px; color: #6B7280; font-weight: 600;">QTY</th>
              <th style="text-align: right; padding: 10px 0; font-size: 12px; color: #6B7280; font-weight: 600;">PRICE</th>
            </tr>
          </thead>
          <tbody>
            {{#each order.lines}}
            <tr style="border-bottom: 1px solid #F3F4F6;">
              <td style="padding: 12px 0; color: #374151;">{{this.productName}}{{#if this.variantName}} - {{this.variantName}}{{/if}}</td>
              <td style="text-align: center; padding: 12px 0; color: #6B7280;">{{this.quantity}}</td>
              <td style="text-align: right; padding: 12px 0; color: #374151; font-weight: 500;">{{this.totalPrice.gross.amount}} {{this.totalPrice.gross.currency}}</td>
            </tr>
            {{/each}}
            <tr style="border-top: 2px solid #E5E7EB;">
              <td colspan="2" style="text-align: right; padding: 15px 0 8px 0; color: #1F2937; font-size: 16px; font-weight: 600;">Total:</td>
              <td style="text-align: right; padding: 15px 0 8px 0; color: ${PRIMARY_COLOR}; font-size: 16px; font-weight: 700;">{{order.total.gross.amount}} {{order.total.gross.currency}}</td>
            </tr>
          </tbody>
        </mj-table>
      </mj-column>
    </mj-section>

    ${addressSection}

    <!-- Footer -->
    <mj-section padding="30px 25px">
      <mj-column>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 20px 0" />
        <mj-text align="center" font-size="14px" color="#6B7280" padding-bottom="10px">
          Need help? Contact us at <a href="mailto:${COMPANY_EMAIL}" style="color: ${PRIMARY_COLOR}; text-decoration: none;">${COMPANY_EMAIL}</a>
        </mj-text>
        <mj-text align="center" font-size="11px" color="#D1D5DB">
          © 2024 ${COMPANY_NAME}. All rights reserved.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

const defaultOrderFulfilledMjmlTemplate = `<mjml>
  <mj-head>
    ${emailStyles}
  </mj-head>
  <mj-body background-color="#F3F4F6">
    <mj-section background-color="${PRIMARY_COLOR}" padding="40px 0">
      <mj-column>
        <mj-text align="center" font-size="28px" font-weight="bold" color="#FFFFFF" padding-bottom="10px">
          📦 Your Order is On Its Way!
        </mj-text>
        <mj-text align="center" font-size="16px" color="#DBEAFE">
          Order #{{order.number}} has been fulfilled
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section background-color="#FFFFFF" padding="30px 25px">
      <mj-column>
        <mj-text font-size="18px" color="#1F2937" padding-bottom="15px">
          Great news! 🎉
        </mj-text>
        <mj-text>
          Your order has been fulfilled and is being prepared for shipment. You'll receive another email once your package is on its way.
        </mj-text>
        
        <mj-text css-class="info-box" padding-top="25px">
          <div class="order-detail">
            <strong>Order Number:</strong> <span class="highlight">#{{order.number}}</span>
          </div>
          <div class="order-detail">
            <strong>Status:</strong> <span style="color: #059669; font-weight: 600;">Fulfilled</span>
          </div>
        </mj-text>
      </mj-column>
    </mj-section>

    ${addressSection}

    <mj-section padding="30px 25px">
      <mj-column>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 20px 0" />
        <mj-text align="center" font-size="14px" color="#6B7280">
          Questions? Contact us at <a href="mailto:${COMPANY_EMAIL}" style="color: ${PRIMARY_COLOR}; text-decoration: none;">${COMPANY_EMAIL}</a>
        </mj-text>
        <mj-text align="center" font-size="11px" color="#D1D5DB">
          © 2024 ${COMPANY_NAME}
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

const defaultOrderConfirmedMjmlTemplate = `<mjml>
  <mj-head>
    ${emailStyles}
  </mj-head>
  <mj-body background-color="#F3F4F6">
    <mj-section background-color="${PRIMARY_COLOR}" padding="40px 0">
      <mj-column>
        <mj-text align="center" font-size="28px" font-weight="bold" color="#FFFFFF" padding-bottom="10px">
          ✅ Order Confirmed!
        </mj-text>
        <mj-text align="center" font-size="16px" color="#DBEAFE">
          Order #{{order.number}}
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section background-color="#FFFFFF" padding="30px 25px">
      <mj-column>
        <mj-text font-size="18px" color="#1F2937" padding-bottom="15px">
          Excellent! Your order is confirmed 🎉
        </mj-text>
        <mj-text>
          We've confirmed your order and are getting everything ready. We'll send you another update once your items are on their way!
        </mj-text>
        
        <mj-text css-class="info-box" padding-top="25px">
          <div class="order-detail">
            <strong>Order Number:</strong> <span class="highlight">#{{order.number}}</span>
          </div>
          <div class="order-detail">
            <strong>Status:</strong> <span style="color: #059669; font-weight: 600;">Confirmed</span>
          </div>
          <div class="order-detail">
            <strong>Total:</strong> {{order.total.gross.amount}} {{order.total.gross.currency}}
          </div>
        </mj-text>
      </mj-column>
    </mj-section>

    ${addressSection}

    <mj-section padding="30px 25px">
      <mj-column>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 20px 0" />
        <mj-text align="center" font-size="14px" color="#6B7280">
          Questions? Contact us at <a href="mailto:${COMPANY_EMAIL}" style="color: ${PRIMARY_COLOR}; text-decoration: none;">${COMPANY_EMAIL}</a>
        </mj-text>
        <mj-text align="center" font-size="11px" color="#D1D5DB">
          © 2024 ${COMPANY_NAME}
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

const defaultOrderFullyPaidMjmlTemplate = `<mjml>
  <mj-head>
    ${emailStyles}
  </mj-head>
  <mj-body background-color="#F3F4F6">
    <mj-section background-color="${PRIMARY_COLOR}" padding="40px 0">
      <mj-column>
        <mj-text align="center" font-size="28px" font-weight="bold" color="#FFFFFF" padding-bottom="10px">
          💳 Payment Received!
        </mj-text>
        <mj-text align="center" font-size="16px" color="#DBEAFE">
          Order #{{order.number}}
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section background-color="#FFFFFF" padding="30px 25px">
      <mj-column>
        <mj-text font-size="18px" color="#1F2937" padding-bottom="15px">
          Thank you! Your payment has been received 🎉
        </mj-text>
        <mj-text>
          We've received your payment and your order is now being processed. Thank you for your business!
        </mj-text>
        
        <mj-text css-class="info-box" padding-top="25px">
          <div class="order-detail">
            <strong>Order Number:</strong> <span class="highlight">#{{order.number}}</span>
          </div>
          <div class="order-detail">
            <strong>Payment Status:</strong> <span style="color: #059669; font-weight: 600;">Fully Paid</span>
          </div>
          <div class="order-detail">
            <strong>Amount Paid:</strong> {{order.total.gross.amount}} {{order.total.gross.currency}}
          </div>
        </mj-text>
      </mj-column>
    </mj-section>

    ${addressSection}

    <mj-section padding="30px 25px">
      <mj-column>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 20px 0" />
        <mj-text align="center" font-size="14px" color="#6B7280">
          Questions? Contact us at <a href="mailto:${COMPANY_EMAIL}" style="color: ${PRIMARY_COLOR}; text-decoration: none;">${COMPANY_EMAIL}</a>
        </mj-text>
        <mj-text align="center" font-size="11px" color="#D1D5DB">
          © 2024 ${COMPANY_NAME}
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

const defaultOrderRefundedMjmlTemplate = `<mjml>
  <mj-head>
    ${emailStyles}
  </mj-head>
  <mj-body background-color="#F3F4F6">
    <mj-section background-color="${PRIMARY_COLOR}" padding="40px 0">
      <mj-column>
        <mj-text align="center" font-size="28px" font-weight="bold" color="#FFFFFF" padding-bottom="10px">
          💰 Refund Processed
        </mj-text>
        <mj-text align="center" font-size="16px" color="#DBEAFE">
          Order #{{order.number}}
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section background-color="#FFFFFF" padding="30px 25px">
      <mj-column>
        <mj-text font-size="18px" color="#1F2937" padding-bottom="15px">
          Your refund has been processed
        </mj-text>
        <mj-text>
          We've processed your refund. It may take 5-10 business days for the funds to appear in your account, depending on your payment method.
        </mj-text>
        
        <mj-text css-class="info-box" padding-top="25px">
          <div class="order-detail">
            <strong>Order Number:</strong> <span class="highlight">#{{order.number}}</span>
          </div>
          <div class="order-detail">
            <strong>Status:</strong> <span style="color: #DC2626; font-weight: 600;">Refunded</span>
          </div>
          <div class="order-detail">
            <strong>Refund Amount:</strong> {{order.total.gross.amount}} {{order.total.gross.currency}}
          </div>
        </mj-text>
        
        <mj-text padding-top="20px" font-size="13px" color="#6B7280">
          If you have any questions about this refund, please don't hesitate to contact us.
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section padding="30px 25px">
      <mj-column>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 20px 0" />
        <mj-text align="center" font-size="14px" color="#6B7280">
          Questions? Contact us at <a href="mailto:${COMPANY_EMAIL}" style="color: ${PRIMARY_COLOR}; text-decoration: none;">${COMPANY_EMAIL}</a>
        </mj-text>
        <mj-text align="center" font-size="11px" color="#D1D5DB">
          © 2024 ${COMPANY_NAME}
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

const defaultOrderCancelledMjmlTemplate = `<mjml>
  <mj-head>
    ${emailStyles}
  </mj-head>
  <mj-body background-color="#F3F4F6">
    <mj-section background-color="${SECONDARY_COLOR}" padding="40px 0">
      <mj-column>
        <mj-text align="center" font-size="28px" font-weight="bold" color="#FFFFFF" padding-bottom="10px">
          Order Cancelled
        </mj-text>
        <mj-text align="center" font-size="16px" color="#D1D5DB">
          Order #{{order.number}}
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section background-color="#FFFFFF" padding="30px 25px">
      <mj-column>
        <mj-text font-size="18px" color="#1F2937" padding-bottom="15px">
          Your order has been cancelled
        </mj-text>
        <mj-text>
          Your order has been cancelled as requested. If you did not request this cancellation or if you have any questions, please contact us immediately.
        </mj-text>
        
        <mj-text css-class="info-box" padding-top="25px">
          <div class="order-detail">
            <strong>Order Number:</strong> <span class="highlight">#{{order.number}}</span>
          </div>
          <div class="order-detail">
            <strong>Status:</strong> <span style="color: #DC2626; font-weight: 600;">Cancelled</span>
          </div>
          <div class="order-detail">
            <strong>Order Amount:</strong> {{order.total.gross.amount}} {{order.total.gross.currency}}
          </div>
        </mj-text>
        
        <mj-text padding-top="20px" font-size="13px" color="#6B7280">
          If you've already been charged, a refund will be processed within 5-10 business days.
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section padding="30px 25px">
      <mj-column>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 20px 0" />
        <mj-text align="center" font-size="14px" color="#6B7280">
          Questions? Contact us at <a href="mailto:${COMPANY_EMAIL}" style="color: ${PRIMARY_COLOR}; text-decoration: none;">${COMPANY_EMAIL}</a>
        </mj-text>
        <mj-text align="center" font-size="11px" color="#D1D5DB">
          © 2024 ${COMPANY_NAME}
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

const defaultInvoiceSentMjmlTemplate = `<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" />
      <mj-text font-size="14px" color="#374151" line-height="1.6" />
      <mj-section padding="20px 0" />
    </mj-attributes>
    <mj-style inline="inline">
      .invoice-box { background-color: #F9FAFB; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .highlight { color: #2563EB; font-weight: 600; }
      .order-detail { padding: 8px 0; border-bottom: 1px solid #E5E7EB; }
      .order-detail:last-child { border-bottom: none; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#F3F4F6">
    <!-- Header with Brand -->
    <mj-section background-color="#2563EB" padding="40px 0">
      <mj-column>
        <mj-text align="center" font-size="32px" font-weight="bold" color="#FFFFFF" padding-bottom="10px">
          Your Invoice is Ready
        </mj-text>
        <mj-text align="center" font-size="16px" color="#DBEAFE">
          Order #{{order.number}}
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Main Content -->
    <mj-section background-color="#FFFFFF" padding="30px 25px">
      <mj-column>
        <mj-text font-size="18px" color="#1F2937" padding-bottom="15px">
          Hi there! 👋
        </mj-text>
        <mj-text>
          Thank you for your order! Your invoice is now available for download. We've attached the invoice to this email and you can also access it using the button below.
        </mj-text>
        
        <!-- Invoice Details Box -->
        <mj-text css-class="invoice-box" padding-top="25px" padding-bottom="10px">
          <div class="order-detail">
            <strong>Invoice Number:</strong> <span class="highlight">{{invoice.number}}</span>
          </div>
          <div class="order-detail">
            <strong>Order Number:</strong> {{order.number}}
          </div>
          <div class="order-detail">
            <strong>Order Date:</strong> {{formatDate order.created}}
          </div>
          <div class="order-detail">
            <strong>Total Amount:</strong> <span class="highlight">{{order.total.gross.amount}} {{order.total.gross.currency}}</span>
          </div>
        </mj-text>

        <!-- Download Button -->
        <mj-button 
          background-color="#2563EB" 
          color="#FFFFFF" 
          border-radius="6px"
          font-size="16px"
          font-weight="600"
          padding="30px 0 20px 0"
          inner-padding="14px 32px"
          href="{{invoice.url}}">
          📄 Download Invoice
        </mj-button>

        <mj-text align="center" font-size="12px" color="#6B7280" padding-top="15px">
          The invoice is also attached to this email for your convenience
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Order Summary -->
    <mj-section background-color="#FFFFFF" padding="25px" padding-top="15px">
      <mj-column>
        <mj-text font-size="16px" font-weight="600" color="#1F2937" padding-bottom="15px">
          Order Summary
        </mj-text>
        
        <!-- Order Items -->
        <mj-table padding-bottom="15px">
          <thead>
            <tr style="border-bottom: 2px solid #E5E7EB;">
              <th style="text-align: left; padding: 10px 0; font-size: 12px; color: #6B7280; font-weight: 600;">ITEM</th>
              <th style="text-align: center; padding: 10px 0; font-size: 12px; color: #6B7280; font-weight: 600;">QTY</th>
              <th style="text-align: right; padding: 10px 0; font-size: 12px; color: #6B7280; font-weight: 600;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {{#each order.lines}}
              <tr style="border-bottom: 1px solid #F3F4F6;">
                <td style="padding: 12px 0; color: #374151;">
                  {{this.productName}}{{#if this.variantName}} - {{this.variantName}}{{/if}}
                </td>
                <td style="text-align: center; padding: 12px 0; color: #6B7280;">
                  {{this.quantity}}
                </td>
                <td style="text-align: right; padding: 12px 0; color: #374151; font-weight: 500;">
                  {{this.totalPrice.gross.amount}} {{this.totalPrice.gross.currency}}
                </td>
              </tr>
            {{/each}}
          </tbody>
        </mj-table>

        <!-- Totals -->
        <mj-table>
          <tbody>
            <tr>
              <td style="text-align: right; padding: 8px 0; color: #6B7280;">Subtotal:</td>
              <td style="text-align: right; padding: 8px 0 8px 20px; color: #374151; font-weight: 500;">
                {{order.subtotal.gross.amount}} {{order.subtotal.gross.currency}}
              </td>
            </tr>
            {{#if order.shippingPrice}}
            <tr>
              <td style="text-align: right; padding: 8px 0; color: #6B7280;">Shipping:</td>
              <td style="text-align: right; padding: 8px 0 8px 20px; color: #374151; font-weight: 500;">
                {{order.shippingPrice.gross.amount}} {{order.shippingPrice.gross.currency}}
              </td>
            </tr>
            {{/if}}
            <tr style="border-top: 2px solid #E5E7EB;">
              <td style="text-align: right; padding: 15px 0 8px 0; color: #1F2937; font-size: 16px; font-weight: 600;">Total:</td>
              <td style="text-align: right; padding: 15px 0 8px 20px; color: #2563EB; font-size: 16px; font-weight: 700;">
                {{order.total.gross.amount}} {{order.total.gross.currency}}
              </td>
            </tr>
          </tbody>
        </mj-table>
      </mj-column>
    </mj-section>

    <!-- Billing Address -->
    {{#if order.billingAddress}}
    <mj-section background-color="#FFFFFF" padding="25px" padding-top="15px">
      <mj-column>
        <mj-text font-size="14px" font-weight="600" color="#1F2937" padding-bottom="10px">
          Billing Address
        </mj-text>
        <mj-text font-size="13px" color="#6B7280" line-height="1.6">
          {{order.billingAddress.streetAddress1}}<br/>
          {{#if order.billingAddress.streetAddress2}}{{order.billingAddress.streetAddress2}}<br/>{{/if}}
          {{order.billingAddress.city}}, {{order.billingAddress.postalCode}}<br/>
          {{order.billingAddress.country.country}}
        </mj-text>
      </mj-column>
    </mj-section>
    {{/if}}

    <!-- Footer -->
    <mj-section padding="30px 25px">
      <mj-column>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 20px 0" />
        
        <mj-text align="center" font-size="14px" color="#6B7280" padding-bottom="10px">
          Need help? Contact us at <a href="mailto:${COMPANY_EMAIL}" style="color: ${PRIMARY_COLOR}; text-decoration: none;">${COMPANY_EMAIL}</a>
        </mj-text>
        
        <mj-text align="center" font-size="12px" color="#9CA3AF">
          This invoice was automatically generated for your order.<br/>
          Please keep this for your records.
        </mj-text>

        <mj-text align="center" font-size="11px" color="#D1D5DB" padding-top="15px">
          © 2024 ${COMPANY_NAME}. All rights reserved.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

const defaultGiftCardSentMjmlTemplate = `<mjml>
  <mj-head>
    ${emailStyles}
  </mj-head>
  <mj-body background-color="#F3F4F6">
    <mj-section background-color="${PRIMARY_COLOR}" padding="40px 0">
      <mj-column>
        <mj-text align="center" font-size="28px" font-weight="bold" color="#FFFFFF" padding-bottom="10px">
          🎁 Your Gift Card is Here!
        </mj-text>
        <mj-text align="center" font-size="16px" color="#DBEAFE">
          A special gift just for you
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section background-color="#FFFFFF" padding="30px 25px">
      <mj-column>
        <mj-text font-size="18px" color="#1F2937" padding-bottom="15px">
          Congratulations! 🎉
        </mj-text>
        <mj-text>
          You've received a gift card! Use the code below when checking out to redeem your gift card balance.
        </mj-text>
        
        <mj-text css-class="info-box" padding-top="25px" align="center">
          <div style="font-size: 24px; font-weight: 700; color: ${PRIMARY_COLOR}; letter-spacing: 2px; padding: 20px 0;">
            GIFT-CARD-CODE-HERE
          </div>
        </mj-text>
        
        <mj-button background-color="${PRIMARY_COLOR}" color="#FFFFFF" border-radius="6px" padding="30px 0 20px 0" href="${COMPANY_WEBSITE}">
          Start Shopping
        </mj-button>
        
        <mj-text align="center" font-size="12px" color="#6B7280" padding-top="15px">
          Save this email - you'll need your gift card code to make purchases
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section padding="30px 25px">
      <mj-column>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 20px 0" />
        <mj-text align="center" font-size="14px" color="#6B7280">
          Questions? Contact us at <a href="mailto:${COMPANY_EMAIL}" style="color: ${PRIMARY_COLOR}; text-decoration: none;">${COMPANY_EMAIL}</a>
        </mj-text>
        <mj-text align="center" font-size="11px" color="#D1D5DB">
          © 2024 ${COMPANY_NAME}
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

const defaultAccountConfirmationMjmlTemplate = `<mjml>
  <mj-head>
    ${emailStyles}
  </mj-head>
  <mj-body background-color="#F3F4F6">
    <mj-section background-color="${PRIMARY_COLOR}" padding="40px 0">
      <mj-column>
        <mj-text align="center" font-size="28px" font-weight="bold" color="#FFFFFF" padding-bottom="10px">
          Welcome to ${COMPANY_NAME}! 🎉
        </mj-text>
        <mj-text align="center" font-size="16px" color="#DBEAFE">
          Just one more step to get started
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section background-color="#FFFFFF" padding="30px 25px">
      <mj-column>
        <mj-text font-size="18px" color="#1F2937" padding-bottom="15px">
          Hi {{user.first_name}}! 👋
        </mj-text>
        <mj-text>
          Thank you for creating an account with us! We're excited to have you as part of our community.
        </mj-text>
        <mj-text padding-top="15px">
          To complete your registration and activate your account, please click the button below:
        </mj-text>
        
        <mj-button 
          background-color="${PRIMARY_COLOR}" 
          color="#FFFFFF" 
          border-radius="6px"
          font-size="16px"
          font-weight="600"
          padding="30px 0 20px 0"
          inner-padding="14px 32px"
          href="{{confirm_url}}">
          ✅ Activate My Account
        </mj-button>
        
        <mj-text align="center" font-size="12px" color="#6B7280" padding-top="15px">
          This link will expire in 24 hours for security reasons
        </mj-text>
        
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="25px 0" />
        
        <mj-text font-size="13px" color="#6B7280">
          If you didn't create this account, you can safely ignore this email.
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section padding="30px 25px">
      <mj-column>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 20px 0" />
        <mj-text align="center" font-size="14px" color="#6B7280">
          Questions? Contact us at <a href="mailto:${COMPANY_EMAIL}" style="color: ${PRIMARY_COLOR}; text-decoration: none;">${COMPANY_EMAIL}</a>
        </mj-text>
        <mj-text align="center" font-size="11px" color="#D1D5DB">
          © 2024 ${COMPANY_NAME}
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

const defaultAccountPasswordResetMjmlTemplate = `<mjml>
  <mj-head>
    ${emailStyles}
  </mj-head>
  <mj-body background-color="#F3F4F6">
    <mj-section background-color="${PRIMARY_COLOR}" padding="40px 0">
      <mj-column>
        <mj-text align="center" font-size="28px" font-weight="bold" color="#FFFFFF" padding-bottom="10px">
          🔐 Password Reset Request
        </mj-text>
        <mj-text align="center" font-size="16px" color="#DBEAFE">
          We received a request to reset your password
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section background-color="#FFFFFF" padding="30px 25px">
      <mj-column>
        <mj-text font-size="18px" color="#1F2937" padding-bottom="15px">
          Hi {{user.first_name}}! 👋
        </mj-text>
        <mj-text>
          We received a request to reset the password for your account. Click the button below to choose a new password:
        </mj-text>
        
        <mj-button 
          background-color="${PRIMARY_COLOR}" 
          color="#FFFFFF" 
          border-radius="6px"
          font-size="16px"
          font-weight="600"
          padding="30px 0 20px 0"
          inner-padding="14px 32px"
          href="{{reset_url}}">
          🔑 Reset My Password
        </mj-button>
        
        <mj-text align="center" font-size="12px" color="#6B7280" padding-top="15px">
          This link will expire in 1 hour for security reasons
        </mj-text>
        
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="25px 0" />
        
        <mj-text font-size="13px" color="#DC2626" font-weight="600">
          ⚠️ Security Notice
        </mj-text>
        <mj-text font-size="13px" color="#6B7280" padding-top="10px">
          If you didn't request a password reset, please ignore this email or contact us if you're concerned about your account's security.
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section padding="30px 25px">
      <mj-column>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 20px 0" />
        <mj-text align="center" font-size="14px" color="#6B7280">
          Questions? Contact us at <a href="mailto:${COMPANY_EMAIL}" style="color: ${PRIMARY_COLOR}; text-decoration: none;">${COMPANY_EMAIL}</a>
        </mj-text>
        <mj-text align="center" font-size="11px" color="#D1D5DB">
          © 2024 ${COMPANY_NAME}
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

const defaultAccountChangeEmailRequestMjmlTemplate = `<mjml>
  <mj-head>
    ${emailStyles}
  </mj-head>
  <mj-body background-color="#F3F4F6">
    <mj-section background-color="${PRIMARY_COLOR}" padding="40px 0">
      <mj-column>
        <mj-text align="center" font-size="28px" font-weight="bold" color="#FFFFFF" padding-bottom="10px">
          📧 Email Change Request
        </mj-text>
        <mj-text align="center" font-size="16px" color="#DBEAFE">
          Please confirm your new email address
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section background-color="#FFFFFF" padding="30px 25px">
      <mj-column>
        <mj-text font-size="18px" color="#1F2937" padding-bottom="15px">
          Hi {{user.first_name}}! 👋
        </mj-text>
        <mj-text>
          We received a request to change your email address. To confirm this change, please click the button below:
        </mj-text>
        
        <mj-text css-class="info-box" padding-top="25px">
          <div class="order-detail">
            <strong>New Email Address:</strong>
          </div>
          <div style="padding: 10px 0; font-size: 16px; color: ${PRIMARY_COLOR}; font-weight: 600;">
            {{new_email}}
          </div>
        </mj-text>
        
        <mj-button 
          background-color="${PRIMARY_COLOR}" 
          color="#FFFFFF" 
          border-radius="6px"
          font-size="16px"
          font-weight="600"
          padding="30px 0 20px 0"
          inner-padding="14px 32px"
          href="{{redirect_url}}">
          ✉️ Confirm Email Change
        </mj-button>
        
        <mj-text align="center" font-size="12px" color="#6B7280" padding-top="15px">
          This link will expire in 24 hours
        </mj-text>
        
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="25px 0" />
        
        <mj-text font-size="13px" color="#6B7280">
          If you didn't request this change, please contact us immediately to secure your account.
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section padding="30px 25px">
      <mj-column>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 20px 0" />
        <mj-text align="center" font-size="14px" color="#6B7280">
          Questions? Contact us at <a href="mailto:${COMPANY_EMAIL}" style="color: ${PRIMARY_COLOR}; text-decoration: none;">${COMPANY_EMAIL}</a>
        </mj-text>
        <mj-text align="center" font-size="11px" color="#D1D5DB">
          © 2024 ${COMPANY_NAME}
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

const defaultAccountChangeEmailConfirmationMjmlTemplate = `<mjml>
  <mj-head>
    ${emailStyles}
  </mj-head>
  <mj-body background-color="#F3F4F6">
    <mj-section background-color="${PRIMARY_COLOR}" padding="40px 0">
      <mj-column>
        <mj-text align="center" font-size="28px" font-weight="bold" color="#FFFFFF" padding-bottom="10px">
          ✅ Email Changed Successfully
        </mj-text>
        <mj-text align="center" font-size="16px" color="#DBEAFE">
          Your email address has been updated
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section background-color="#FFFFFF" padding="30px 25px">
      <mj-column>
        <mj-text font-size="18px" color="#1F2937" padding-bottom="15px">
          Hi {{user.first_name}}! 👋
        </mj-text>
        <mj-text>
          This confirms that your email address has been successfully changed. You can now use your new email address to log in to your account.
        </mj-text>
        
        <mj-text css-class="info-box" padding-top="25px" align="center">
          <div style="color: #059669; font-weight: 600; font-size: 16px;">
            ✓ Email Successfully Updated
          </div>
        </mj-text>
        
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="25px 0" />
        
        <mj-text font-size="13px" color="#6B7280">
          If you didn't make this change, please contact us immediately.
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section padding="30px 25px">
      <mj-column>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 20px 0" />
        <mj-text align="center" font-size="14px" color="#6B7280">
          Questions? Contact us at <a href="mailto:${COMPANY_EMAIL}" style="color: ${PRIMARY_COLOR}; text-decoration: none;">${COMPANY_EMAIL}</a>
        </mj-text>
        <mj-text align="center" font-size="11px" color="#D1D5DB">
          © 2024 ${COMPANY_NAME}
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

const defaultAccountDeleteMjmlTemplate = `<mjml>
  <mj-head>
    ${emailStyles}
  </mj-head>
  <mj-body background-color="#F3F4F6">
    <mj-section background-color="#DC2626" padding="40px 0">
      <mj-column>
        <mj-text align="center" font-size="28px" font-weight="bold" color="#FFFFFF" padding-bottom="10px">
          ⚠️ Account Deletion Request
        </mj-text>
        <mj-text align="center" font-size="16px" color="#FEE2E2">
          This action is permanent and cannot be undone
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section background-color="#FFFFFF" padding="30px 25px">
      <mj-column>
        <mj-text font-size="18px" color="#1F2937" padding-bottom="15px">
          Hi {{user.first_name}}! 👋
        </mj-text>
        <mj-text>
          We received a request to delete your account. This action is permanent and cannot be reversed.
        </mj-text>
        
        <mj-text css-class="info-box" padding-top="25px" background-color="#FEF2F2">
          <div style="color: #DC2626; font-weight: 600; margin-bottom: 10px;">
            ⚠️ Warning: This will permanently delete:
          </div>
          <ul style="color: #6B7280; margin: 0; padding-left: 20px;">
            <li>Your account information</li>
            <li>Order history</li>
            <li>Saved addresses</li>
            <li>All personal data</li>
          </ul>
        </mj-text>
        
        <mj-text padding-top="20px" font-size="14px" font-weight="600" color="#1F2937">
          If you're sure you want to proceed, click the button below:
        </mj-text>
        
        <mj-button 
          background-color="#DC2626" 
          color="#FFFFFF" 
          border-radius="6px"
          font-size="16px"
          font-weight="600"
          padding="30px 0 20px 0"
          inner-padding="14px 32px"
          href="{{redirect_url}}">
          🗑️ Confirm Account Deletion
        </mj-button>
        
        <mj-text align="center" font-size="12px" color="#6B7280" padding-top="15px">
          This link will expire in 24 hours
        </mj-text>
        
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="25px 0" />
        
        <mj-text font-size="13px" color="#6B7280">
          If you didn't request this, please ignore this email and your account will remain active. You may want to change your password for security.
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section padding="30px 25px">
      <mj-column>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 20px 0" />
        <mj-text align="center" font-size="14px" color="#6B7280">
          Questions? Contact us at <a href="mailto:${COMPANY_EMAIL}" style="color: ${PRIMARY_COLOR}; text-decoration: none;">${COMPANY_EMAIL}</a>
        </mj-text>
        <mj-text align="center" font-size="11px" color="#D1D5DB">
          © 2024 ${COMPANY_NAME}
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

const defaultOrderFulfillmentUpdatedMjmlTemplate = `<mjml>
  <mj-head>
    ${emailStyles}
  </mj-head>
  <mj-body background-color="#F3F4F6">
    <mj-section background-color="${PRIMARY_COLOR}" padding="40px 0">
      <mj-column>
        <mj-text align="center" font-size="28px" font-weight="bold" color="#FFFFFF" padding-bottom="10px">
          📦 Shipment Update
        </mj-text>
        <mj-text align="center" font-size="16px" color="#DBEAFE">
          Order #{{order.number}}
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section background-color="#FFFFFF" padding="30px 25px">
      <mj-column>
        <mj-text font-size="18px" color="#1F2937" padding-bottom="15px">
          Your order has been updated! 📦
        </mj-text>
        <mj-text>
          We've updated the fulfillment status for your order. Here are the latest details:
        </mj-text>
        
        <mj-text css-class="info-box" padding-top="25px">
          <div class="order-detail">
            <strong>Order Number:</strong> <span class="highlight">#{{order.number}}</span>
          </div>
          {{#if fulfillment.tracking_number}}
          <div class="order-detail">
            <strong>Tracking Number:</strong> <span style="font-family: monospace; color: ${PRIMARY_COLOR}; font-weight: 600;">{{fulfillment.tracking_number}}</span>
          </div>
          {{/if}}
          <div class="order-detail">
            <strong>Status:</strong> <span style="color: #059669; font-weight: 600;">Updated</span>
          </div>
        </mj-text>
        
        {{#if fulfillment.tracking_number}}
        <mj-text padding-top="20px" font-size="13px" color="#6B7280">
          Use the tracking number above to track your shipment with your carrier.
        </mj-text>
        {{/if}}
      </mj-column>
    </mj-section>

    ${addressSectionForNotify}

    <mj-section padding="30px 25px">
      <mj-column>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 20px 0" />
        <mj-text align="center" font-size="14px" color="#6B7280">
          Questions? Contact us at <a href="mailto:${COMPANY_EMAIL}" style="color: ${PRIMARY_COLOR}; text-decoration: none;">${COMPANY_EMAIL}</a>
        </mj-text>
        <mj-text align="center" font-size="11px" color="#D1D5DB">
          © 2024 ${COMPANY_NAME}
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

const defaultContactSubmissionReplyMjmlTemplate = `<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" />
      <mj-text font-size="14px" color="#374151" line-height="1.6" />
      <mj-section padding="20px 0" />
    </mj-attributes>
    <mj-style inline="inline">
      .info-box { background-color: #F9FAFB; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .highlight { color: ${PRIMARY_COLOR}; font-weight: 600; }
      .order-detail { padding: 8px 0; border-bottom: 1px solid #E5E7EB; }
      .order-detail:last-child { border-bottom: none; }
      .reply-box { background-color: #F0F9FF; border-left: 4px solid ${PRIMARY_COLOR}; border-radius: 8px; padding: 20px; margin: 20px 0; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#F3F4F6">
    <!-- Header -->
    <mj-section background-color="${PRIMARY_COLOR}" padding="40px 0">
      <mj-column>
        <mj-text align="center" font-size="28px" font-weight="bold" color="#FFFFFF" padding-bottom="10px">
          📧 Response to Your Inquiry
        </mj-text>
        <mj-text align="center" font-size="16px" color="#DBEAFE">
          We're here to help!
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Main Content -->
    <mj-section background-color="#FFFFFF" padding="30px 25px">
      <mj-column>
        <mj-text font-size="18px" color="#1F2937" padding-bottom="15px">
          Dear {{submission.name}}, 👋
        </mj-text>
        <mj-text>
          Thank you for reaching out to us. We've received your message and wanted to provide you with a response.
        </mj-text>
        
        <!-- Original Inquiry Details -->
        <mj-text css-class="info-box" padding-top="25px" padding-bottom="10px">
          <div class="order-detail">
            <strong>Your Inquiry:</strong> <span class="highlight">{{submission.subject}}</span>
          </div>
          <div class="order-detail">
            <strong>Submitted:</strong> {{formatDate submission.created_at}}
          </div>
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Reply Message -->
    <mj-section background-color="#FFFFFF" padding="25px" padding-top="15px">
      <mj-column>
        <mj-text font-size="16px" font-weight="600" color="#1F2937" padding-bottom="15px">
          Our Response
        </mj-text>
        <mj-text css-class="reply-box" padding="20px">
          <div style="white-space: pre-wrap; color: #1F2937; line-height: 1.7;">{{reply_message}}</div>
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Original Message Reference -->
    <mj-section background-color="#FFFFFF" padding="25px" padding-top="15px">
      <mj-column>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 20px 0" />
        <mj-text font-size="14px" font-weight="600" color="#6B7280" padding-bottom="10px">
          Your Original Message
        </mj-text>
        <mj-text css-class="info-box" padding="20px" background-color="#F9FAFB">
          <div style="white-space: pre-wrap; color: #6B7280; line-height: 1.6; font-size: 13px;">{{submission.message}}</div>
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Additional Help -->
    <mj-section background-color="#FFFFFF" padding="25px" padding-top="15px">
      <mj-column>
        <mj-text font-size="14px" color="#6B7280" padding-top="15px">
          If you have any further questions or need additional assistance, please don't hesitate to reply to this email or contact us directly.
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Footer -->
    <mj-section padding="30px 25px">
      <mj-column>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 20px 0" />
        <mj-text align="center" font-size="14px" color="#6B7280" padding-bottom="10px">
          Need more help? Contact us at <a href="mailto:${COMPANY_EMAIL}" style="color: ${PRIMARY_COLOR}; text-decoration: none;">${COMPANY_EMAIL}</a>
        </mj-text>
        <mj-text align="center" font-size="11px" color="#D1D5DB">
          © 2024 ${COMPANY_NAME}. All rights reserved.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

const defaultNewsletterSubscribeMjmlTemplate = `<mjml>
  <mj-head>
    ${emailStyles}
  </mj-head>
  <mj-body background-color="#F3F4F6">
    <!-- Header -->
    <mj-section background-color="${PRIMARY_COLOR}" padding="40px 0">
      <mj-column>
        <mj-text align="center" font-size="28px" font-weight="bold" color="#FFFFFF" padding-bottom="10px">
          🎉 Welcome to Our Newsletter!
        </mj-text>
        <mj-text align="center" font-size="16px" color="#DBEAFE">
          Thank you for subscribing
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Main Content -->
    <mj-section background-color="#FFFFFF" padding="30px 25px">
      <mj-column>
        <mj-text font-size="18px" color="#1F2937" padding-bottom="15px">
          Hello{{#if user.first_name}} {{user.first_name}}{{/if}}! 👋
        </mj-text>
        <mj-text>
          Thank you for subscribing to the ${COMPANY_NAME} newsletter! We're thrilled to have you join our community.
        </mj-text>
        <mj-text padding-top="15px">
          You'll now receive:
        </mj-text>
        <mj-text css-class="info-box" padding-top="20px">
          <div class="order-detail">
            ✨ <strong>Exclusive offers</strong> and special discounts
          </div>
          <div class="order-detail">
            📰 <strong>Latest updates</strong> on new products and collections
          </div>
          <div class="order-detail">
            🎁 <strong>Early access</strong> to sales and promotions
          </div>
          <div class="order-detail">
            💡 <strong>Tips and insights</strong> to enhance your shopping experience
          </div>
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- CTA Section -->
    <mj-section background-color="#FFFFFF" padding="25px" padding-top="15px">
      <mj-column>
        <mj-button background-color="${PRIMARY_COLOR}" color="#FFFFFF" href="${COMPANY_WEBSITE}" border-radius="8px" padding="15px 30px">
          Start Shopping
        </mj-button>
      </mj-column>
    </mj-section>

    <!-- Footer -->
    <mj-section padding="30px 25px">
      <mj-column>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 20px 0" />
        <mj-text align="center" font-size="14px" color="#6B7280" padding-bottom="10px">
          Questions? Contact us at <a href="mailto:${COMPANY_EMAIL}" style="color: ${PRIMARY_COLOR}; text-decoration: none;">${COMPANY_EMAIL}</a>
        </mj-text>
        <mj-text align="center" font-size="11px" color="#D1D5DB">
          © 2024 ${COMPANY_NAME}. All rights reserved.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

const defaultNewsletterReactivateMjmlTemplate = `<mjml>
  <mj-head>
    ${emailStyles}
  </mj-head>
  <mj-body background-color="#F3F4F6">
    <!-- Header -->
    <mj-section background-color="${PRIMARY_COLOR}" padding="40px 0">
      <mj-column>
        <mj-text align="center" font-size="28px" font-weight="bold" color="#FFFFFF" padding-bottom="10px">
          👋 Welcome Back!
        </mj-text>
        <mj-text align="center" font-size="16px" color="#DBEAFE">
          We've missed you
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Main Content -->
    <mj-section background-color="#FFFFFF" padding="30px 25px">
      <mj-column>
        <mj-text font-size="18px" color="#1F2937" padding-bottom="15px">
          Hello{{#if user.first_name}} {{user.first_name}}{{/if}}! 🎉
        </mj-text>
        <mj-text>
          Great to have you back in the ${COMPANY_NAME} newsletter community! We've been keeping the best deals and updates waiting for you.
        </mj-text>
        <mj-text padding-top="15px">
          Here's what you've been missing:
        </mj-text>
        <mj-text css-class="info-box" padding-top="20px">
          <div class="order-detail">
            🆕 <strong>New arrivals</strong> and exciting product launches
          </div>
          <div class="order-detail">
            💰 <strong>Exclusive discounts</strong> just for subscribers
          </div>
          <div class="order-detail">
            🎯 <strong>Personalized recommendations</strong> based on your interests
          </div>
          <div class="order-detail">
            🏷️ <strong>Flash sales</strong> and limited-time offers
          </div>
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- CTA Section -->
    <mj-section background-color="#FFFFFF" padding="25px" padding-top="15px">
      <mj-column>
        <mj-button background-color="${PRIMARY_COLOR}" color="#FFFFFF" href="${COMPANY_WEBSITE}" border-radius="8px" padding="15px 30px">
          See What's New
        </mj-button>
      </mj-column>
    </mj-section>

    <!-- Footer -->
    <mj-section padding="30px 25px">
      <mj-column>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 20px 0" />
        <mj-text align="center" font-size="14px" color="#6B7280" padding-bottom="10px">
          Questions? Contact us at <a href="mailto:${COMPANY_EMAIL}" style="color: ${PRIMARY_COLOR}; text-decoration: none;">${COMPANY_EMAIL}</a>
        </mj-text>
        <mj-text align="center" font-size="11px" color="#D1D5DB">
          © 2024 ${COMPANY_NAME}. All rights reserved.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

export const defaultMjmlTemplates: Record<MessageEventTypes, string> = {
  ACCOUNT_CHANGE_EMAIL_CONFIRM: defaultAccountChangeEmailConfirmationMjmlTemplate,
  ACCOUNT_CHANGE_EMAIL_REQUEST: defaultAccountChangeEmailRequestMjmlTemplate,
  ACCOUNT_CONFIRMATION: defaultAccountConfirmationMjmlTemplate,
  ACCOUNT_DELETE: defaultAccountDeleteMjmlTemplate,
  ACCOUNT_PASSWORD_RESET: defaultAccountPasswordResetMjmlTemplate,
  CONTACT_SUBMISSION_REPLY: defaultContactSubmissionReplyMjmlTemplate,
  GIFT_CARD_SENT: defaultGiftCardSentMjmlTemplate,
  INVOICE_SENT: defaultInvoiceSentMjmlTemplate,
  NEWSLETTER_SUBSCRIBE: defaultNewsletterSubscribeMjmlTemplate,
  NEWSLETTER_REACTIVATE: defaultNewsletterReactivateMjmlTemplate,
  ORDER_CANCELLED: defaultOrderCancelledMjmlTemplate,
  ORDER_CONFIRMED: defaultOrderConfirmedMjmlTemplate,
  ORDER_CREATED: defaultOrderCreatedMjmlTemplate,
  ORDER_FULFILLED: defaultOrderFulfilledMjmlTemplate,
  ORDER_FULFILLMENT_UPDATE: defaultOrderFulfillmentUpdatedMjmlTemplate,
  ORDER_FULLY_PAID: defaultOrderFullyPaidMjmlTemplate,
  ORDER_REFUNDED: defaultOrderRefundedMjmlTemplate,
};

export const defaultMjmlSubjectTemplates: Record<MessageEventTypes, string> = {
  ACCOUNT_CHANGE_EMAIL_CONFIRM: `✅ Email Address Changed Successfully - ${COMPANY_NAME}`,
  ACCOUNT_CHANGE_EMAIL_REQUEST: `📧 Confirm Your New Email Address - ${COMPANY_NAME}`,
  ACCOUNT_CONFIRMATION: `🎉 Welcome to ${COMPANY_NAME}! Activate Your Account`,
  ACCOUNT_DELETE: `⚠️ Account Deletion Request - ${COMPANY_NAME}`,
  ACCOUNT_PASSWORD_RESET: `🔐 Password Reset Request - ${COMPANY_NAME}`,
  CONTACT_SUBMISSION_REPLY: `{{#if reply_subject}}{{reply_subject}}{{else}}Re: {{submission.subject}}{{/if}} - ${COMPANY_NAME}`,
  GIFT_CARD_SENT: `🎁 Your Gift Card Has Arrived! - ${COMPANY_NAME}`,
  INVOICE_SENT: `📄 Your Invoice #{{invoice.number}} for Order #{{order.number}} is Ready`,
  NEWSLETTER_SUBSCRIBE: `🎉 Welcome to ${COMPANY_NAME} Newsletter!`,
  NEWSLETTER_REACTIVATE: `👋 Welcome Back to ${COMPANY_NAME}!`,
  ORDER_CANCELLED: `Order #{{order.number}} Has Been Cancelled - ${COMPANY_NAME}`,
  ORDER_CONFIRMED: `✅ Order #{{order.number}} Confirmed! - ${COMPANY_NAME}`,
  ORDER_CREATED: `🛍️ Thank You for Your Order #{{order.number}} - ${COMPANY_NAME}`,
  ORDER_FULFILLED: `📦 Great News! Your Order #{{order.number}} is On Its Way - ${COMPANY_NAME}`,
  ORDER_FULFILLMENT_UPDATE: `📦 Shipment Update for Order #{{order.number}} - ${COMPANY_NAME}`,
  ORDER_FULLY_PAID: `💳 Payment Received for Order #{{order.number}} - ${COMPANY_NAME}`,
  ORDER_REFUNDED: `💰 Refund Processed for Order #{{order.number}} - ${COMPANY_NAME}`,
};
