import { ConditionalGiftCardsFilterProver } from "@dashboard/components/ConditionalFilter";
import { WindowTitle } from "@dashboard/components/WindowTitle";
import { sectionNames } from "@dashboard/intl";
import { parseQs } from "@dashboard/url-utils";
import { asSortParams } from "@dashboard/utils/sort";
import { useIntl } from "react-intl";
import { Route, Routes, useParams, useLocation } from "react-router";

import GiftCardSettings from "./GiftCardSettings";
import GiftCardListComponent from "./GiftCardsList";
import { GiftCardListUrlQueryParams, GiftCardUrlSortField } from "./GiftCardsList/types";
import GiftCardUpdateComponent from "./GiftCardUpdate";
import { GiftCardUpdatePageUrlQueryParams } from "./GiftCardUpdate/types";
import { giftCardPath, giftCardSettingsUrl, giftCardsListPath } from "./urls";

const GiftCardUpdatePage = () => {
  const { id } = useParams();
  const location = useLocation();
  const qs = parseQs(location.search.substr(1));
  const params: GiftCardUpdatePageUrlQueryParams = qs;

  return <GiftCardUpdateComponent id={decodeURIComponent(id ?? "")} params={params} />;
};

const GiftCardList = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: GiftCardListUrlQueryParams = asSortParams(
    qs,
    GiftCardUrlSortField,
    GiftCardUrlSortField.usedBy,
  );

  return (
    <ConditionalGiftCardsFilterProver locationSearch={location.search}>
      <GiftCardListComponent params={params} />
    </ConditionalGiftCardsFilterProver>
  );
};

const Component = () => {
  const intl = useIntl();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.giftCards)} />
      <Routes>
        <Route path={giftCardSettingsUrl} element={<GiftCardSettings />} />
        <Route path={giftCardsListPath} element={<GiftCardList />} />
        <Route path={giftCardPath(":id")} element={<GiftCardUpdatePage />} />
      </Routes>
    </>
  );
};

export default Component;
