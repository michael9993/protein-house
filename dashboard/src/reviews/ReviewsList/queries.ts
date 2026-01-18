import { gql, useQuery } from "@apollo/client";

export const reviews = gql`
  query Reviews(
    $first: Int
    $after: String
    $filter: ProductReviewFilterInput
  ) {
    reviews(first: $first, after: $after, filter: $filter) {
      edges {
        node {
          id
          rating
          title
          body
          images
          helpfulCount
          status
          isVerifiedPurchase
          createdAt
          updatedAt
          product {
            id
            name
            slug
          }
          user {
            id
            email
            firstName
            lastName
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

export const useReviewsQuery = (options: any) => {
  return useQuery(reviews, options);
};

