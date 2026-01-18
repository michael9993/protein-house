import { DashboardModal } from "@dashboard/components/Modal";
import { reviewListUrl } from "@dashboard/reviews/urls";
import useNavigator from "@dashboard/hooks/useNavigator";
import createDialogActionHandlers from "@dashboard/utils/handlers/dialogActionHandlers";
import { createContext, useContext } from "react";
import * as React from "react";

import { ReviewListActionParamsEnum, ReviewListUrlQueryParams } from "../../ReviewsList/types";

interface ReviewListDialogsProviderProps {
  children: React.ReactNode;
  params: ReviewListUrlQueryParams;
}

interface ReviewListDialogsConsumerProps {
  openDeleteDialog: (id?: string | React.MouseEvent) => void;
  openSearchSaveDialog: () => void;
  openSearchDeleteDialog: () => void;
  onClose: () => void;
  id: string;
}

const ReviewListDialogsContext = createContext<ReviewListDialogsConsumerProps | null>(null);

export const useReviewListDialogs = () => {
  const context = useContext(ReviewListDialogsContext);

  if (!context) {
    throw new Error("You are trying to use ReviewListDialogsContext outside of its provider");
  }

  return context;
};

const ReviewListDialogsProvider = ({ children, params }: ReviewListDialogsProviderProps) => {
  const navigate = useNavigator();
  const id = params?.id;
  const { DELETE } = ReviewListActionParamsEnum;
  const [openDialog, onClose] = createDialogActionHandlers<
    ReviewListActionParamsEnum,
    ReviewListUrlQueryParams
  >(navigate, reviewListUrl, params);
  const handleDeleteDialogOpen = () => {
    openDialog(DELETE);
  };
  const openSearchDeleteDialog = () => openDialog(ReviewListActionParamsEnum.DELETE_SEARCH);
  const openSearchSaveDialog = () => openDialog(ReviewListActionParamsEnum.SAVE_SEARCH);
  const providerValues: ReviewListDialogsConsumerProps = {
    openDeleteDialog: handleDeleteDialogOpen,
    openSearchSaveDialog,
    openSearchDeleteDialog,
    onClose,
    id: id ?? "",
  };

  return (
    <ReviewListDialogsContext.Provider value={providerValues}>
      {children}
      {/* TODO: Add delete dialog */}
    </ReviewListDialogsContext.Provider>
  );
};

export default ReviewListDialogsProvider;

