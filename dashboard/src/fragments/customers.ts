import { gql } from "@apollo/client";

export const customerFragment = gql`
  fragment Customer on User {
    id
    email
    firstName
    lastName
  }
`;

export const customerDetailsFragment = gql`
  fragment CustomerDetails on User {
    ...Customer
    dateJoined
    lastLogin
    defaultShippingAddress {
      ...Address
    }
    defaultBillingAddress {
      ...Address
    }
    note
    isActive
  }
`;

export const customerAddressesFragment = gql`
  fragment CustomerAddresses on User {
    ...Customer
    addresses {
      ...Address
    }
    defaultBillingAddress {
      id
    }
    defaultShippingAddress {
      id
    }
  }
`;

export const contactSubmissionFragment = gql`
  fragment ContactSubmission on ContactSubmission {
    id
    name
    email
    subject
    message
    status
    createdAt
    updatedAt
    repliedAt
    channel {
      id
      name
      slug
    }
    repliedBy {
      id
      email
      firstName
      lastName
    }
  }
`;
