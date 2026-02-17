import { ConditionalProductFilterProvider } from "@dashboard/components/ConditionalFilter/context";
import { sectionNames } from "@dashboard/intl";
import { parseQs } from "@dashboard/url-utils";
import { asSortParams } from "@dashboard/utils/sort";
import { getArrayQueryParam } from "@dashboard/utils/urls";
import { useIntl } from "react-intl";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router";

import { WindowTitle } from "../components/WindowTitle";
import {
  ProductCreateUrlQueryParams,
  ProductImageUrlQueryParams,
  productListPath,
  ProductListUrlQueryParams,
  ProductListUrlSortField,
  ProductUrlQueryParams,
  ProductVariantAddUrlQueryParams,
  productVariantEditPath,
  ProductVariantEditUrlQueryParams,
} from "./urls";
import ProductCreateComponent from "./views/ProductCreate";
import ProductImageComponent from "./views/ProductImage";
import ProductListComponent from "./views/ProductList";
import ProductUpdateComponent from "./views/ProductUpdate";
import ProductVariantComponent from "./views/ProductVariant";
import ProductVariantCreateComponent from "./views/ProductVariantCreate";

const ProductList = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: ProductListUrlQueryParams = asSortParams(
    {
      ...qs,
      categories: getArrayQueryParam(qs.categories),
      collections: getArrayQueryParam(qs.collections),
      ids: getArrayQueryParam(qs.ids),
      productTypes: getArrayQueryParam(qs.productTypes),
      productKind: qs.productKind,
    },
    ProductListUrlSortField,
    ProductListUrlSortField.date,
    false,
  );

  return (
    <ConditionalProductFilterProvider locationSearch={location.search}>
      <ProductListComponent params={params} />
    </ConditionalProductFilterProvider>
  );
};
const ProductUpdate = () => {
  const location = useLocation();
  const { id } = useParams();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: ProductUrlQueryParams = qs;

  return (
    <ProductUpdateComponent
      id={decodeURIComponent(id ?? "")}
      params={{
        ...params,
        ids: getArrayQueryParam(qs.ids),
      }}
    />
  );
};
const ProductCreate = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1));
  const params: ProductCreateUrlQueryParams = qs;

  return <ProductCreateComponent params={params} />;
};
const ProductVariant = () => {
  const location = useLocation();
  const { variantId } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: ProductVariantEditUrlQueryParams = qs;

  return (
    <ProductVariantComponent
      variantId={decodeURIComponent(variantId ?? "")}
      params={params}
    />
  );
};

const ProductImage = () => {
  const location = useLocation();
  const { imageId, productId } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: ProductImageUrlQueryParams = qs;

  return (
    <ProductImageComponent
      mediaId={decodeURIComponent(imageId ?? "")}
      productId={decodeURIComponent(productId ?? "")}
      params={params}
    />
  );
};
const ProductVariantCreate = () => {
  const location = useLocation();
  const { id } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: ProductVariantAddUrlQueryParams = qs;

  return (
    <ProductVariantCreateComponent
      productId={decodeURIComponent(id ?? "")}
      params={params}
    />
  );
};

/** Redirect old product variant path to new format */
const LegacyVariantRedirect = () => {
  const location = useLocation();
  const { variantId } = useParams();

  if (!variantId) {
    return <Navigate to={productListPath} replace />;
  }

  return (
    <Navigate
      to={{ pathname: productVariantEditPath(variantId), search: location.search }}
      replace
    />
  );
};

const Component = () => {
  const intl = useIntl();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.products)} />
      <Routes>
        <Route index element={<ProductList />} />
        <Route path="add" element={<ProductCreate />} />
        <Route path=":id/variant/add" element={<ProductVariantCreate />} />
        <Route
          path=":productId/variant/:variantId"
          element={<LegacyVariantRedirect />}
        />
        <Route path="variant/:variantId" element={<ProductVariant />} />
        <Route path=":productId/image/:imageId" element={<ProductImage />} />
        <Route path=":id" element={<ProductUpdate />} />
      </Routes>
    </>
  );
};

export default Component;
