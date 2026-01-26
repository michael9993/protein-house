import type { IGraphQLConfig } from "graphql-config";

const config: IGraphQLConfig = {
  projects: {
    default: {
      schema: "./graphql/schema.graphql",
      documents: ["./graphql/**/*.graphql"],
      extensions: {
        codegen: {
          generates: {
            "./generated/graphql.ts": {
              plugins: [
                "typescript",
                "typescript-operations",
                "typed-document-node",
                "typescript-urql",
              ],
              config: {
                strictScalars: true,
                scalars: {
                  Date: "string",
                  DateTime: "string",
                  Day: "number",
                  Decimal: "string",
                  GenericScalar: "unknown",
                  JSON: "unknown",
                  JSONString: "string",
                  Metadata: "Record<string, string>",
                  Minute: "number",
                  PositiveDecimal: "string",
                  UUID: "string",
                  Upload: "unknown",
                  WeightScalar: "string",
                  _Any: "unknown",
                },
              },
            },
          },
        },
      },
    },
  },
};

export default config;
