import { SaleorThrobber } from "@dashboard/components/Throbber";

const LoginLoading = () => {
  return (
    <div className="flex items-center h-screen justify-center">
      <SaleorThrobber size={64} />
    </div>
  );
};

LoginLoading.displayName = "LoginLoading";
export default LoginLoading;
