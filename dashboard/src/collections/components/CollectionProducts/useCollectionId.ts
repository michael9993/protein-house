import { useParams } from "react-router";

export const useCollectionId = () => {
  const { id: collectionId } = useParams<"id">();

  return decodeURIComponent(collectionId ?? "");
};
