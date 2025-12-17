export default function Home() {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Invoice App</h1>
      <p>This app generates PDF invoices when INVOICE_REQUESTED webhook is triggered.</p>
      <p>
        <strong>Status:</strong> Running
      </p>
      <p>
        <strong>Webhook:</strong> <code>/api/webhooks/invoice-requested</code>
      </p>
    </div>
  );
}

