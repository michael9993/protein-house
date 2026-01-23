import { CustomerServiceListUrlSortField } from "@dashboard/customers/urls";
import { ContactSubmissionSortField } from "@dashboard/graphql";
import { createGetSortQueryVariables } from "@dashboard/utils/sort";

function getSortQueryField(sort: CustomerServiceListUrlSortField): ContactSubmissionSortField | undefined {
  switch (sort) {
    case CustomerServiceListUrlSortField.createdAt:
      return ContactSubmissionSortField.CREATED_AT;
    case CustomerServiceListUrlSortField.updatedAt:
      return ContactSubmissionSortField.UPDATED_AT;
    case CustomerServiceListUrlSortField.name:
      return ContactSubmissionSortField.NAME;
    case CustomerServiceListUrlSortField.email:
      return ContactSubmissionSortField.EMAIL;
    case CustomerServiceListUrlSortField.status:
      return ContactSubmissionSortField.STATUS;
    default:
      return undefined;
  }
}

export const getSortQueryVariables = createGetSortQueryVariables(getSortQueryField);
