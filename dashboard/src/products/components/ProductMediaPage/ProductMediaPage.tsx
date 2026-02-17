// @ts-strict-ignore
import { TopNav } from "@dashboard/components/AppLayout/TopNav";
import { DashboardCard } from "@dashboard/components/Card";
import { ConfirmButtonTransitionState } from "@dashboard/components/ConfirmButton";
import Form from "@dashboard/components/Form";
import Grid from "@dashboard/components/Grid";
import { Savebar } from "@dashboard/components/Savebar";
import { ProductMediaType } from "@dashboard/graphql";
import useNavigator from "@dashboard/hooks/useNavigator";
import { commonMessages } from "@dashboard/intl";
import { productUrl } from "@dashboard/products/urls";
import { TextField } from "@mui/material";
import { Skeleton } from "@saleor/macaw-ui-next";
import { defineMessages, useIntl } from "react-intl";

import ProductMediaNavigation from "../ProductMediaNavigation";

const messages = defineMessages({
  editMedia: {
    id: "Ihp4D3",
    defaultMessage: "Edit Media",
    description: "header",
  },
  mediaInformation: {
    id: "9RvXNg",
    defaultMessage: "Media Information",
    description: "section header",
  },
  mediaView: {
    id: "cW1RIo",
    defaultMessage: "Media View",
    description: "section header",
  },
  optional: {
    id: "lzdvwp",
    defaultMessage: "Optional",
    description: "field is optional",
  },
});
interface ProductMediaPageProps {
  productId: string;
  mediaObj?: {
    id: string;
    alt: string;
    url: string;
    type: string;
    oembedData?: string;
  };
  media?: Array<{
    id: string;
    url: string;
  }>;
  disabled: boolean;
  product: string;
  saveButtonBarState: ConfirmButtonTransitionState;
  onDelete: () => void;
  onRowClick: (id: string) => () => void;
  onSubmit: (data: { description: string }) => void;
}

const ProductMediaPage = (props: ProductMediaPageProps) => {
  const {
    productId,
    disabled,
    mediaObj,
    media,
    saveButtonBarState,
    onDelete,
    onRowClick,
    onSubmit,
  } = props;
  const intl = useIntl();
  const navigate = useNavigator();

  return (
    <Form initial={{ description: mediaObj ? mediaObj.alt : "" }} onSubmit={onSubmit} confirmLeave>
      {({ change, data, submit }) => (
        <>
          <TopNav href={productUrl(productId)} title={intl.formatMessage(messages.editMedia)} />
          <Grid variant="inverted">
            <div>
              <ProductMediaNavigation
                disabled={disabled}
                media={media}
                highlighted={media ? mediaObj.id : undefined}
                onRowClick={onRowClick}
              />
              <DashboardCard>
                <DashboardCard.Header>
                  <DashboardCard.Title>
                    {intl.formatMessage(messages.mediaInformation)}
                  </DashboardCard.Title>
                </DashboardCard.Header>
                <DashboardCard.Content>
                  <TextField
                    name="description"
                    label={intl.formatMessage(commonMessages.description)}
                    helperText={intl.formatMessage(messages.optional)}
                    disabled={disabled}
                    onChange={change}
                    value={data.description}
                    multiline
                    fullWidth
                  />
                </DashboardCard.Content>
              </DashboardCard>
            </div>
            <div>
              <DashboardCard>
                <DashboardCard.Header>
                  <DashboardCard.Title>
                    {intl.formatMessage(messages.mediaView)}
                  </DashboardCard.Title>
                </DashboardCard.Header>
                <DashboardCard.Content>
                  {mediaObj ? (
                    mediaObj?.type === ProductMediaType.IMAGE ? (
                      <div className="[&_iframe]:w-full [&_iframe]:max-h-[420px] border border-default-1 rounded-lg mx-auto mb-4 w-full p-4">
                        <img className="h-full object-contain w-full" src={mediaObj.url} alt={mediaObj.alt} />
                      </div>
                    ) : (
                      <div
                        className="[&_iframe]:w-full [&_iframe]:max-h-[420px] border border-default-1 rounded-lg mx-auto mb-4 w-full p-4"
                        dangerouslySetInnerHTML={{
                          __html: JSON.parse(mediaObj?.oembedData)?.html,
                        }}
                      />
                    )
                  ) : (
                    <Skeleton />
                  )}
                </DashboardCard.Content>
              </DashboardCard>
            </div>
          </Grid>
          <Savebar>
            <Savebar.DeleteButton onClick={onDelete} />
            <Savebar.Spacer />
            <Savebar.CancelButton onClick={() => navigate(productUrl(productId))} />
            <Savebar.ConfirmButton
              transitionState={saveButtonBarState}
              onClick={submit}
              disabled={disabled || !onSubmit}
            />
          </Savebar>
        </>
      )}
    </Form>
  );
};

ProductMediaPage.displayName = "ProductMediaPage";
export default ProductMediaPage;
