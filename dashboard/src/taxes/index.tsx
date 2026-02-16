import { sectionNames } from "@dashboard/intl";
import { parseQs } from "@dashboard/url-utils";
import { useIntl } from "react-intl";
import { Route, Routes, useLocation, useParams } from "react-router";

import { WindowTitle } from "../components/WindowTitle";
import {
  taxClassesListUrl,
  taxConfigurationListPath,
  taxCountriesListPath,
  TaxesUrlQueryParams,
} from "./urls";
import TaxChannelsListComponent from "./views/TaxChannelsList";
import TaxClassesListComponent from "./views/TaxClassesList";
import TaxCountriesListComponent from "./views/TaxCountriesList";

const TaxChannelsList = () => {
  const { id } = useParams();
  const location = useLocation();
  const qs: TaxesUrlQueryParams = parseQs(location.search.substring(1));

  return <TaxChannelsListComponent id={decodeURIComponent(id ?? "")} params={qs} />;
};
const TaxCountriesList = () => {
  const { id } = useParams();
  const location = useLocation();
  const qs: TaxesUrlQueryParams = parseQs(location.search.substring(1));

  return <TaxCountriesListComponent id={decodeURIComponent(id ?? "")} params={qs} />;
};
const TaxClassesList = () => {
  const { id } = useParams();

  return <TaxClassesListComponent id={decodeURIComponent(id ?? "")} />;
};
const Component = () => {
  const intl = useIntl();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.taxes)} />
      <Routes>
        <Route path={taxConfigurationListPath(":id")} element={<TaxChannelsList />} />
        <Route path={taxConfigurationListPath()} element={<TaxChannelsList />} />
        <Route path={taxCountriesListPath(":id")} element={<TaxCountriesList />} />
        <Route path={taxCountriesListPath()} element={<TaxCountriesList />} />
        <Route path={taxClassesListUrl(":id")} element={<TaxClassesList />} />
        <Route path={taxClassesListUrl()} element={<TaxClassesList />} />
      </Routes>
    </>
  );
};

export default Component;
