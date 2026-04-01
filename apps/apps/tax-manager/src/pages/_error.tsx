import Head from "next/head";
import { NextPageContext } from "next";

interface ErrorProps {
  statusCode?: number;
}

function Error({ statusCode }: ErrorProps) {
  const message =
    statusCode === 404
      ? "This page could not be found."
      : statusCode
        ? `An error ${statusCode} occurred on the server.`
        : "An error occurred on the client.";

  return (
    <>
      <Head>
        <title>{statusCode ? `${statusCode} - Error` : "Error"}</title>
      </Head>
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
        <h1 style={{ margin: 0, fontSize: statusCode ? "4rem" : "1.5rem" }}>
          {statusCode ?? "Error"}
        </h1>
        <p style={{ marginTop: 8 }}>{message}</p>
      </div>
    </>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext): ErrorProps => {
  const statusCode = res ? res.statusCode : (err?.statusCode ?? 404);
  return { statusCode };
};

export default Error;
