import type { IGraphQLConfig } from "graphql-config";

const config: IGraphQLConfig = {
  projects: {
    default: {
      schema: "graphql/schema.graphql",
      documents: ["src/**/*.graphql", "graphql/**/*.graphql"],
      extensions: {
        codegen: {
          generates: {
            "generated/graphql.ts": {
              plugins: [
                "typescript",
                "typescript-operations",
                "typed-document-node",
                "typescript-urql",
              ],
              config: {
                documentVariableSuffix: "Document",
                fragmentVariableSuffix: "Fragment",
                dedupeFragments: true,
                strictScalars: true,
                scalars: {
                  Date: "string",
                  DateTime: "string",
                  Decimal: "string",
                  GenericScalar: "unknown",
                  JSON: "unknown",
                  JSONString: "string",
                  Metadata: "Record<string, string>",
                  PositiveDecimal: "string",
                  UUID: "string",
                  Upload: "unknown",
                  WeightScalar: "number",
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
