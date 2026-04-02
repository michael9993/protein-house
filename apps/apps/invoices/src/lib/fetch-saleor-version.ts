import { Client, gql } from "urql";

const SaleorVersionQuery = gql`
  query FetchSaleorVersion {
    shop {
      version
    }
  }
`;

export async function fetchSaleorVersion(client: Client): Promise<string> {
  const { error, data } = await client.query(SaleorVersionQuery, {}).toPromise();

  if (error || !data?.shop.version) {
    throw new Error("Can't fetch Saleor version");
  }

  return data.shop.version;
}
