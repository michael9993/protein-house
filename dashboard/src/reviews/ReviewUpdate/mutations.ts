import { gql } from "@apollo/client";

export const productReviewDelete = gql`
  mutation ProductReviewDelete($reviewId: ID!) {
    productReviewDelete(reviewId: $reviewId) {
      errors {
        field
        message
      }
      productErrors {
        field
        message
      }
      review {
        id
      }
    }
  }
`;

export const productReviewUpdate = gql`
  mutation ProductReviewUpdate($input: ProductReviewUpdateInput!) {
    productReviewUpdate(input: $input) {
      errors {
        field
        message
      }
      productErrors {
        field
        message
      }
      review {
        id
        rating
        title
        body
        images
        status
      }
    }
  }
`;

