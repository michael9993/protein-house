import { gql, useQuery } from "@apollo/client";
import { createContext, useContext } from "react";
import * as React from "react";

const REVIEW_DETAILS_QUERY = gql`
  query ReviewDetails($id: ID!) {
    review(id: $id) {
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
`;


interface ReviewDetailsProviderProps {
  children: React.ReactNode;
  id: string;
}

interface ReviewDetailsConsumerProps {
  review: any;
  loading: boolean;
  refetch: () => void;
}

const ReviewDetailsContext = createContext<ReviewDetailsConsumerProps | null>(null);

export const useReviewDetails = (_id?: string) => {
  const context = useContext(ReviewDetailsContext);

  if (!context) {
    throw new Error("You are trying to use ReviewDetailsContext outside of its provider");
  }

  return context;
};

export const ReviewDetailsProvider = ({ children, id }: ReviewDetailsProviderProps) => {
  // Ensure ID is properly formatted (should be a global ID like "UHJvZHVjdFJldmlldzox")
  // The ID comes from the URL, so it might be URL-encoded
  const normalizedId = id ? decodeURIComponent(id.trim()) : null;

  const { data, loading, error, refetch } = useQuery(REVIEW_DETAILS_QUERY, {
    variables: { id: normalizedId },
    skip: !normalizedId,
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
    onError: (err) => {
      console.error("ReviewDetails query error:", err, "ID:", normalizedId);
    },
  });

  // Get review from direct query
  const review = data?.review || null;

  // Log for debugging
  if (error) {
    console.error("ReviewDetails query error:", error, "ID:", normalizedId, "Error details:", error.graphQLErrors);
  }

  if (!loading && !review && normalizedId) {
    console.warn("Review not found. ID:", normalizedId, "Query data:", data);
  }

  const providerValues: ReviewDetailsConsumerProps = {
    review,
    loading,
    refetch: () => refetch(),
  };

  return (
    <ReviewDetailsContext.Provider value={providerValues}>
      {children}
    </ReviewDetailsContext.Provider>
  );
};

