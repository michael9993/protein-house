// @ts-strict-ignore
import { CustomerDetailsQuery, useCustomerDetailsQuery } from "@dashboard/graphql";
import { createContext } from "react";
import * as React from "react";

interface CustomerDetailsProviderProps {
  id: string;
}

interface CustomerDetailsConsumerProps {
  customer: CustomerDetailsQuery | null;
  loading: boolean | null;
}

export const CustomerDetailsContext = createContext<CustomerDetailsConsumerProps>(null);

export const CustomerDetailsProvider = ({
  children,
  id,
}: CustomerDetailsProviderProps & { children: React.ReactNode }) => {
  // Type assertion: codegen v4 enforces required variables intersection,
  // but our custom useQuery wrapper injects permission variables automatically
  const { data, loading } = useCustomerDetailsQuery({
    displayLoader: true,
    variables: {
      id,
    },
  } as Parameters<typeof useCustomerDetailsQuery>[0]);
  const providerValues: CustomerDetailsConsumerProps = {
    customer: data,
    loading,
  };

  return (
    <CustomerDetailsContext.Provider value={providerValues}>
      {children}
    </CustomerDetailsContext.Provider>
  );
};
