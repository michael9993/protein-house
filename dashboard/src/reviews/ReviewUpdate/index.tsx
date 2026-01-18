import ReviewUpdatePage from "./ReviewUpdatePage";
import { ReviewUpdatePageUrlQueryParams } from "./types";

interface ReviewUpdateProps {
  params: ReviewUpdatePageUrlQueryParams;
  id: string;
}

const ReviewUpdate = ({ id, params }: ReviewUpdateProps) => (
  <ReviewUpdatePage id={id} params={params} />
);

export default ReviewUpdate;

