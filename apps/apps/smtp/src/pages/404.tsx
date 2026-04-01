export default function Custom404() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "4rem" }}>404</h1>
      <p style={{ marginTop: 8 }}>This page could not be found.</p>
    </div>
  );
}
