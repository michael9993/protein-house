import { parseQs } from "@dashboard/url-utils";
import { createContext, useContext } from "react";
import { Route, Routes, useLocation } from "react-router";

import Layout from "./components/Layout";
import { UserContext as Context } from "./types";
import {
  LoginUrlQueryParams,
  newPasswordPath,
  passwordResetPath,
  passwordResetSuccessPath,
} from "./urls";
import LoginViewComponent from "./views/Login";
import NewPassword from "./views/NewPassword";
import ResetPassword from "./views/ResetPassword";
import ResetPasswordSuccess from "./views/ResetPasswordSuccess";

const LoginView = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: LoginUrlQueryParams = qs;

  return <LoginViewComponent params={params} />;
};

export const UserContext = createContext<Context>({
  login: undefined,
  loginByExternalPlugin: undefined,
  logout: undefined,
  requestLoginByExternalPlugin: undefined,
  authenticating: false,
  isCredentialsLogin: false,
  authenticated: false,
  errors: [],
  refetchUser: undefined,
});

const AuthRouter = () => (
  <Layout>
    <Routes>
      <Route path={passwordResetSuccessPath} element={<ResetPasswordSuccess />} />
      <Route path={passwordResetPath} element={<ResetPassword />} />
      <Route path={newPasswordPath} element={<NewPassword />} />
      <Route path="*" element={<LoginView />} />
    </Routes>
  </Layout>
);

AuthRouter.displayName = "AuthRouter";
export default AuthRouter;

export * from "./utils";
export const useUser = () => useContext(UserContext);
