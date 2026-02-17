import notFoundImage from "@assets/images/not-found-404.svg";
import { Button } from "@dashboard/components/Button";
import { Text } from "@saleor/macaw-ui-next";
import SVG from "react-inlinesvg";
import { FormattedMessage } from "react-intl";

type NotFoundPageProps =
  | {
      onBack: () => void;
      backHref?: never;
    }
  | {
      onBack?: never;
      backHref: string;
    };

const NotFoundPage = (props: NotFoundPageProps) => {
  const { onBack, backHref } = props;

  return (
    <div className="flex items-center h-screen">
      <div className="grid grid-cols-[1fr_487px] mx-auto w-[830px] max-md:grid-cols-1 max-md:p-6 max-md:w-full">
        <div className="flex flex-col justify-center max-md:order-1 max-md:text-center">
          <div>
            <Text className="font-semibold" size={6} fontWeight="bold" lineHeight={3}>
              <FormattedMessage id="yH56V+" defaultMessage="Ooops!..." />
            </Text>
            <Text
              className="font-semibold"
              size={4}
              fontWeight="bold"
              lineHeight={2}
              display="block"
            >
              <FormattedMessage id="bj6pTd" defaultMessage="Something's missing" />
            </Text>
            <Text display="block">
              <FormattedMessage id="nRiOg+" defaultMessage="Sorry, the page was not found" />
            </Text>
          </div>
          <div>
            <Button className="mt-4 p-[20px]" variant="primary" onClick={onBack} href={backHref}>
              <FormattedMessage
                id="95oJ5d"
                defaultMessage="Go back to dashboard"
                description="button"
              />
            </Button>
          </div>
        </div>
        <div>
          <SVG className="[&_svg]:w-full" src={notFoundImage} />
        </div>
      </div>
    </div>
  );
};

NotFoundPage.displayName = "NotFoundPage";
export default NotFoundPage;
