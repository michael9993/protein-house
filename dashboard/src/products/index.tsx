import { ConditionalProductFilterProvider } from "@dashboard/components/ConditionalFilter/context";
import { sectionNames } from "@dashboard/intl";
import { parseQs } from "@dashboard/url-utils";
import { asSortParams } from "@dashboard/utils/sort";
import { getArrayQueryParam } from "@dashboard/utils/urls";
import { useIntl } from "react-intl";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router";

import { WindowTitle } from "../components/WindowTitle";
import {
  productAddPath,
  ProductCreateUrlQueryParams,
  productImagePath,
  ProductImageUrlQueryParams,
  productListPath,
  ProductListUrlQueryParams,
  ProductListUrlSortField,
  productPath,
  ProductUrlQueryParams,
  productVariantAddPath,
  ProductVariantAddUrlQueryParams,
  productVariantEditPath,
  ProductVariantEditUrlQueryParams,
  productVariantLegacyEditPath,
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
        <Route path={productListPath} element={<ProductList />} />
        <Route path={productAddPath} element={<ProductCreate />} />
        <Route path={productVariantAddPath(":id")} element={<ProductVariantCreate />} />
        <Route
          path={productVariantLegacyEditPath(":productId", ":variantId")}
          element={<LegacyVariantRedirect />}
        />
        <Route path={productVariantEditPath(":variantId")} element={<ProductVariant />} />
        <Route path={productImagePath(":productId", ":imageId")} element={<ProductImage />} />
        <Route path={productPath(":id")} element={<ProductUpdate />} />
      </Routes>
    </>
  );
};

export default Component;
