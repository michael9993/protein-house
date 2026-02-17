import { sectionNames } from "@dashboard/intl";
import { parseQs } from "@dashboard/url-utils";
import { asSortParams } from "@dashboard/utils/sort";
import { useIntl } from "react-intl";
import { Route, Routes, useLocation, useParams } from "react-router";

import { WindowTitle } from "../components/WindowTitle";
import {
  ChannelsListUrlQueryParams,
  ChannelsListUrlSortField,
} from "./urls";
import ChannelCreateComponent from "./views/ChannelCreate";
import ChannelDetailsComponent from "./views/ChannelDetails";
import ChannelsListComponent from "./views/ChannelsList";

const ChannelDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const params = parseQs(location.search.substr(1));

  return <ChannelDetailsComponent id={decodeURIComponent(id ?? "")} params={params} />;
};

const ChannelsList = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: ChannelsListUrlQueryParams = asSortParams(qs, ChannelsListUrlSortField);

  return <ChannelsListComponent params={params} />;
};

const ChannelsSection = () => {
  const intl = useIntl();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.channels)} />
      <Routes>
        <Route index element={<ChannelsList />} />
        <Route path="add" element={<ChannelCreateComponent />} />
        <Route path=":id" element={<ChannelDetails />} />
      </Routes>
    </>
  );
};

export default ChannelsSection;
