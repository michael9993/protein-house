import { gql } from "@apollo/client";

import { contactSubmissionFragment } from "../fragments/customers";

export const updateCustomer = gql`
  mutation UpdateCustomer($id: ID!, $input: CustomerInput!) {
    customerUpdate(id: $id, input: $input) {
      errors {
        ...AccountError
      }
      user {
        ...CustomerDetails
      }
    }
  }
`;

export const createCustomer = gql`
  mutation CreateCustomer($input: UserCreateInput!) {
    customerCreate(input: $input) {
      errors {
        ...AccountError
      }
      user {
        id
      }
    }
  }
`;

export const removeCustomer = gql`
  mutation RemoveCustomer($id: ID!) {
    customerDelete(id: $id) {
      errors {
        ...AccountError
      }
    }
  }
`;

export const setCustomerDefaultAddress = gql`
  mutation SetCustomerDefaultAddress($addressId: ID!, $userId: ID!, $type: AddressTypeEnum!) {
    addressSetDefault(addressId: $addressId, userId: $userId, type: $type) {
      errors {
        ...AccountError
      }
      user {
        ...CustomerAddresses
      }
    }
  }
`;

export const createCustomerAddress = gql`
  mutation CreateCustomerAddress($id: ID!, $input: AddressInput!) {
    addressCreate(userId: $id, input: $input) {
      errors {
        ...AccountError
      }
      address {
        ...Address
      }
      user {
        ...CustomerAddresses
      }
    }
  }
`;

export const updateCustomerAddress = gql`
  mutation UpdateCustomerAddress($id: ID!, $input: AddressInput!) {
    addressUpdate(id: $id, input: $input) {
      errors {
        ...AccountError
      }
      address {
        ...Address
      }
    }
  }
`;

export const removeCustomerAddress = gql`
  mutation RemoveCustomerAddress($id: ID!) {
    addressDelete(id: $id) {
      errors {
        ...AccountError
      }
      user {
        ...CustomerAddresses
      }
    }
  }
`;

export const bulkRemoveCustomers = gql`
  mutation BulkRemoveCustomers($ids: [ID!]!) {
    customerBulkDelete(ids: $ids) {
      errors {
        ...AccountError
      }
    }
  }
`;

export const contactSubmissionUpdateStatus = gql`
  ${contactSubmissionFragment}
  mutation ContactSubmissionUpdateStatus($id: ID!, $status: ContactSubmissionStatusEnum!) {
    contactSubmissionUpdateStatus(id: $id, status: $status) {
      errors {
        ...AccountError
      }
      contactSubmission {
        ...ContactSubmission
      }
    }
  }
`;

export const contactSubmissionDelete = gql`
  mutation ContactSubmissionDelete($id: ID!) {
    contactSubmissionDelete(id: $id) {
      errors {
        ...AccountError
      }
    }
  }
`;

export const contactSubmissionBulkDelete = gql`
  mutation ContactSubmissionBulkDelete($ids: [ID!]!) {
    contactSubmissionBulkDelete(ids: $ids) {
      errors {
        ...AccountError
      }
    }
  }
`;

export const contactSubmissionReply = gql`
  ${contactSubmissionFragment}
  mutation ContactSubmissionReply($input: ContactSubmissionReplyInput!) {
    contactSubmissionReply(input: $input) {
      errors {
        ...AccountError
      }
      contactSubmission {
        ...ContactSubmission
      }
    }
  }
`;
