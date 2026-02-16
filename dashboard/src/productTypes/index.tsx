import { ConditionalProductTypesFilterProvider } from "@dashboard/components/ConditionalFilter";
import { sectionNames } from "@dashboard/intl";
import { parseQs } from "@dashboard/url-utils";
import { asSortParams } from "@dashboard/utils/sort";
import { useIntl } from "react-intl";
import { Route, Routes, useLocation, useParams } from "react-router";

import { WindowTitle } from "../components/WindowTitle";
import {
  productTypeAddPath,
  ProductTypeAddUrlQueryParams,
  productTypeListPath,
  ProductTypeListUrlQueryParams,
  ProductTypeListUrlSortField,
  productTypePath,
  ProductTypeUrlQueryParams,
} from "./urls";
import ProductTypeCreateComponent from "./views/ProductTypeCreate";
import ProductTypeListComponent from "./views/ProductTypeList";
import ProductTypeUpdateComponent from "./views/ProductTypeUpdate";

const ProductTypeList = () => {
  const location = useLocation();
  const qs = parseQs(location.search, {
    ignoreQueryPrefix: true,
    // As a product types list still keeps ids to remove in query params,
    // we need to increase the array limit to 100, default 20,
    // because qs library return object instead of an array when limit is exceeded
    arrayLimit: 100,
  }) as any;
  const params: ProductTypeListUrlQueryParams = asSortParams(qs, ProductTypeListUrlSortField);

  return (
    <ConditionalProductTypesFilterProvider locationSearch={location.search}>
      <ProductTypeListComponent params={params} />
    </ConditionalProductTypesFilterProvider>
  );
};

const ProductTypeCreate = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1));
  const params: ProductTypeAddUrlQueryParams = qs;

  return <ProductTypeCreateComponent params={params} />;
};

const ProductTypeUpdate = () => {
  const { id } = useParams();
  const location = useLocation();
  const qs = parseQs(location.search.substr(1));
  const params: ProductTypeUrlQueryParams = qs;

  return <ProductTypeUpdateComponent id={decodeURIComponent(id ?? "")} params={params} />;
};

const ProductTypeRouter = () => {
  const intl = useIntl();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.productTypes)} />
      <Routes>
        <Route path={productTypeListPath} element={<ProductTypeList />} />
        <Route path={productTypeAddPath} element={<ProductTypeCreate />} />
        <Route path={productTypePath(":id")} element={<ProductTypeUpdate />} />
      </Routes>
    </>
  );
};

ProductTypeRouter.displayName = "ProductTypeRouter";
export default ProductTypeRouter;
