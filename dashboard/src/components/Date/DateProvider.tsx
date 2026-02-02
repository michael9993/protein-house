// @ts-strict-ignore
import { ReactNode, useEffect, useState } from "react";

import { Provider } from "./DateContext";

interface DateProviderProps {
  children: ReactNode;
}

export const DateProvider = ({ children }: DateProviderProps) => {
  const [date, setDate] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setDate(Date.now()), 10000);

    return () => window.clearInterval(intervalId);
  }, []);

  return <Provider value={date}>{children}</Provider>;
};
