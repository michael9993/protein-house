import { LanguageCodeEnum } from "@dashboard/graphql";
import { sectionNames } from "@dashboard/intl";
import { parseQs } from "@dashboard/url-utils";
import { useIntl } from "react-intl";
import { Route, Routes, useLocation, useParams } from "react-router";

import { WindowTitle } from "../components/WindowTitle";

import TranslationsAttributesComponent, {
  TranslationsAttributesQueryParams,
} from "./views/TranslationsAttributes";
import TranslationsCategoriesComponent, {
  TranslationsCategoriesQueryParams,
} from "./views/TranslationsCategories";
import TranslationsCollectionsComponent, {
  TranslationsCollectionsQueryParams,
} from "./views/TranslationsCollections";
import TranslationsEntitiesComponent from "./views/TranslationsEntities";
import TranslationsLanguageList from "./views/TranslationsLanguageList";
import TranslationsMenuItemComponent from "./views/TranslationsMenuItem";
import TranslationsPagesComponent, {
  TranslationsPagesQueryParams,
} from "./views/TranslationsPages";
import TranslationsProductsComponent, {
  TranslationsProductsQueryParams,
} from "./views/TranslationsProducts";
import TranslationsProductVariantsComponent, {
  TranslationsProductVariantsQueryParams,
} from "./views/TranslationsProductVariants";
import TranslationsSaleComponent, { TranslationsSalesQueryParams } from "./views/TranslationsSales";
import TranslationsShippingMethodComponent, {
  TranslationsShippingMethodQueryParams,
} from "./views/TranslationsShippingMethod";
import TranslationsVouchersComponent, {
  TranslationsVouchersQueryParams,
} from "./views/TranslationsVouchers";

const TranslationsEntities = () => {
  const location = useLocation();
  const { languageCode } = useParams();
  const qs = parseQs(location.search.substr(1));

  return <TranslationsEntitiesComponent language={languageCode ?? ""} params={qs} />;
};

const TranslationsCategories = () => {
  const location = useLocation();
  const { id, languageCode } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: TranslationsCategoriesQueryParams = {
    activeField: qs.activeField as string,
  };

  return (
    <TranslationsCategoriesComponent
      id={decodeURIComponent(id ?? "")}
      languageCode={LanguageCodeEnum[languageCode as keyof typeof LanguageCodeEnum]}
      params={params}
    />
  );
};

const TranslationsCollections = () => {
  const location = useLocation();
  const { id, languageCode } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: TranslationsCollectionsQueryParams = {
    activeField: qs.activeField as string,
  };

  return (
    <TranslationsCollectionsComponent
      id={decodeURIComponent(id ?? "")}
      languageCode={LanguageCodeEnum[languageCode as keyof typeof LanguageCodeEnum]}
      params={params}
    />
  );
};

const TranslationsProducts = () => {
  const location = useLocation();
  const { id, languageCode } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: TranslationsProductsQueryParams = {
    activeField: qs.activeField as string,
  };

  return (
    <TranslationsProductsComponent
      id={decodeURIComponent(id ?? "")}
      languageCode={LanguageCodeEnum[languageCode as keyof typeof LanguageCodeEnum]}
      params={params}
    />
  );
};

const TranslationsProductVariants = () => {
  const location = useLocation();
  const { productId, id, languageCode } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: TranslationsProductVariantsQueryParams = {
    activeField: qs.activeField as string,
  };

  return (
    <TranslationsProductVariantsComponent
      id={decodeURIComponent(id ?? "")}
      productId={decodeURIComponent(productId ?? "")}
      languageCode={LanguageCodeEnum[languageCode as keyof typeof LanguageCodeEnum]}
      params={params}
    />
  );
};

const TranslationsSales = () => {
  const location = useLocation();
  const { id, languageCode } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: TranslationsSalesQueryParams = {
    activeField: qs.activeField as string,
  };

  return (
    <TranslationsSaleComponent
      id={decodeURIComponent(id ?? "")}
      languageCode={LanguageCodeEnum[languageCode as keyof typeof LanguageCodeEnum]}
      params={params}
    />
  );
};

const TranslationsVouchers = () => {
  const location = useLocation();
  const { id, languageCode } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: TranslationsVouchersQueryParams = {
    activeField: qs.activeField as string,
  };

  return (
    <TranslationsVouchersComponent
      id={decodeURIComponent(id ?? "")}
      languageCode={LanguageCodeEnum[languageCode as keyof typeof LanguageCodeEnum]}
      params={params}
    />
  );
};

const TranslationsPages = () => {
  const location = useLocation();
  const { id, languageCode } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: TranslationsPagesQueryParams = {
    activeField: qs.activeField as string,
  };

  return (
    <TranslationsPagesComponent
      id={decodeURIComponent(id ?? "")}
      languageCode={LanguageCodeEnum[languageCode as keyof typeof LanguageCodeEnum]}
      params={params}
    />
  );
};

const TranslationsAttributes = () => {
  const location = useLocation();
  const { id, languageCode } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: TranslationsAttributesQueryParams = {
    activeField: qs.activeField as string,
  };

  return (
    <TranslationsAttributesComponent
      id={decodeURIComponent(id ?? "")}
      languageCode={LanguageCodeEnum[languageCode as keyof typeof LanguageCodeEnum]}
      params={params}
    />
  );
};

const TranslationsShippingMethod = () => {
  const location = useLocation();
  const { id, languageCode } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: TranslationsShippingMethodQueryParams = {
    activeField: qs.activeField as string,
  };

  return (
    <TranslationsShippingMethodComponent
      id={decodeURIComponent(id ?? "")}
      languageCode={LanguageCodeEnum[languageCode as keyof typeof LanguageCodeEnum]}
      params={params}
    />
  );
};

const TranslationsMenuItem = () => {
  const location = useLocation();
  const { id, languageCode } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: TranslationsShippingMethodQueryParams = {
    activeField: qs.activeField as string,
  };

  return (
    <TranslationsMenuItemComponent
      id={decodeURIComponent(id ?? "")}
      languageCode={LanguageCodeEnum[languageCode as keyof typeof LanguageCodeEnum]}
      params={params}
    />
  );
};

const TranslationsRouter = () => {
  const intl = useIntl();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.translations)} />
      <Routes>
        <Route index element={<TranslationsLanguageList />} />
        <Route path=":languageCode" element={<TranslationsEntities />} />
        <Route path=":languageCode/products/:id" element={<TranslationsProducts />} />
        <Route
          path=":languageCode/products/:productId/variants/:id"
          element={<TranslationsProductVariants />}
        />
        <Route path=":languageCode/categories/:id" element={<TranslationsCategories />} />
        <Route path=":languageCode/collections/:id" element={<TranslationsCollections />} />
        <Route path=":languageCode/sales/:id" element={<TranslationsSales />} />
        <Route path=":languageCode/vouchers/:id" element={<TranslationsVouchers />} />
        <Route path=":languageCode/pages/:id" element={<TranslationsPages />} />
        <Route path=":languageCode/attributes/:id" element={<TranslationsAttributes />} />
        <Route
          path=":languageCode/shippingMethods/:id"
          element={<TranslationsShippingMethod />}
        />
        <Route path=":languageCode/menuItems/:id" element={<TranslationsMenuItem />} />
      </Routes>
    </>
  );
};

TranslationsRouter.displayName = "TranslationsRouter";
export default TranslationsRouter;
