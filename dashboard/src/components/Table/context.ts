import { createContext, useContext } from "react";

type TableSection = "head" | "body" | "footer";

export const TableSectionContext = createContext<TableSection>("body");

export const useTableSection = () => useContext(TableSectionContext);
