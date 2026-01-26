/**
 * Export analytics data to Excel file
 * Uses xlsx library (SheetJS) for Excel generation
 */

import type { 
  DashboardKPIs, 
  RevenueDataPoint, 
  TopProduct, 
  CategoryData, 
  RecentOrder 
} from "../../analytics/domain/kpi-types";
import { formatCurrency } from "../../analytics/domain/money";
import { format } from "date-fns";

export interface ExportData {
  kpis?: DashboardKPIs;
  revenueOverTime?: RevenueDataPoint[];
  topProducts?: TopProduct[];
  topCategories?: CategoryData[];
  allOrders?: RecentOrder[];
  currency: string;
  dateFrom: string;
  dateTo: string;
  channelName?: string;
}

/**
 * Apply professional styling to a worksheet
 */
function applyWorksheetStyling(worksheet: any, headerRow: number = 0, XLSX: any): void {
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
  
  // Define styles
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
    fill: { fgColor: { rgb: "4472C4" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  const dataStyle = {
    border: {
      top: { style: "thin", color: { rgb: "D0D0D0" } },
      bottom: { style: "thin", color: { rgb: "D0D0D0" } },
      left: { style: "thin", color: { rgb: "D0D0D0" } },
      right: { style: "thin", color: { rgb: "D0D0D0" } },
    },
    alignment: { vertical: "center" },
  };

  // Apply styles to all cells
  for (let R = 0; R <= range.e.r; R++) {
    for (let C = 0; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
      if (!worksheet[cellAddress]) continue;

      if (R === headerRow) {
        worksheet[cellAddress].s = headerStyle;
      } else {
        worksheet[cellAddress].s = dataStyle;
      }
    }
  }
}

/**
 * Set column widths for a worksheet
 */
function setColumnWidths(worksheet: any, widths: number[]): void {
  worksheet["!cols"] = widths.map((width) => ({ wch: width }));
}

/**
 * Export analytics data to Excel file with professional formatting
 * Dynamically imports xlsx to avoid SSR issues
 */
export async function exportAnalyticsToExcel(data: ExportData): Promise<void> {
  // Dynamic import for client-side only
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Summary/KPIs
  if (data.kpis) {
    const kpisData = [
      ["Sales Analytics Summary", "", ""],
      ["Generated:", new Date().toLocaleString(), ""],
      ["Date Range:", `${format(new Date(data.dateFrom), "PP")} - ${format(new Date(data.dateTo), "PP")}`, ""],
    ];
    
    if (data.channelName) {
      kpisData.push(["Channel:", data.channelName, ""]);
    }
    
    kpisData.push(
      ["Currency:", data.currency, ""],
      [],
      ["Key Performance Indicators", "", ""],
      ["Metric", "Value", "Trend"],
      [
        data.kpis.gmv.label,
        data.kpis.gmv.value,
        data.kpis.gmv.trend ? `${data.kpis.gmv.trend.direction === "up" ? "↑" : data.kpis.gmv.trend.direction === "down" ? "↓" : "→"} ${data.kpis.gmv.trend.value}%` : "-"
      ],
      [
        data.kpis.totalOrders.label,
        data.kpis.totalOrders.value,
        data.kpis.totalOrders.trend ? `${data.kpis.totalOrders.trend.direction === "up" ? "↑" : data.kpis.totalOrders.trend.direction === "down" ? "↓" : "→"} ${data.kpis.totalOrders.trend.value}%` : "-"
      ],
      [
        data.kpis.averageOrderValue.label,
        data.kpis.averageOrderValue.value,
        data.kpis.averageOrderValue.trend ? `${data.kpis.averageOrderValue.trend.direction === "up" ? "↑" : data.kpis.averageOrderValue.trend.direction === "down" ? "↓" : "→"} ${data.kpis.averageOrderValue.trend.value}%` : "-"
      ],
      [
        data.kpis.itemsSold.label,
        data.kpis.itemsSold.value,
        data.kpis.itemsSold.trend ? `${data.kpis.itemsSold.trend.direction === "up" ? "↑" : data.kpis.itemsSold.trend.direction === "down" ? "↓" : "→"} ${data.kpis.itemsSold.trend.value}%` : "-"
      ],
      [
        data.kpis.uniqueCustomers.label,
        data.kpis.uniqueCustomers.value,
        data.kpis.uniqueCustomers.trend ? `${data.kpis.uniqueCustomers.trend.direction === "up" ? "↑" : data.kpis.uniqueCustomers.trend.direction === "down" ? "↓" : "→"} ${data.kpis.uniqueCustomers.trend.value}%` : "-"
      ],
    );

    const kpisSheet = XLSX.utils.aoa_to_sheet(kpisData);
    applyWorksheetStyling(kpisSheet, 8, XLSX); // Header row is row 8 (0-indexed)
    setColumnWidths(kpisSheet, [30, 25, 15]);
    XLSX.utils.book_append_sheet(workbook, kpisSheet, "Summary");
  }

  // Sheet 2: Revenue Over Time
  if (data.revenueOverTime && data.revenueOverTime.length > 0) {
    const revenueData = [
      ["Date", "Revenue", "Orders"],
      ...data.revenueOverTime.map((point) => [
        format(new Date(point.date), "PP"),
        point.revenue,
        point.orders,
      ]),
    ];

    const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
    
    // Format currency column
    const range = XLSX.utils.decode_range(revenueSheet["!ref"] || "A1");
    for (let R = 1; R <= range.e.r; R++) {
      const cellAddress = XLSX.utils.encode_cell({ c: 1, r: R });
      if (revenueSheet[cellAddress]) {
        revenueSheet[cellAddress].z = `"${data.currency}" #,##0.00`;
      }
    }
    
    applyWorksheetStyling(revenueSheet, 0, XLSX);
    setColumnWidths(revenueSheet, [20, 18, 12]);
    XLSX.utils.book_append_sheet(workbook, revenueSheet, "Revenue Over Time");
  }

  // Sheet 3: Top Products
  if (data.topProducts && data.topProducts.length > 0) {
    const productsData = [
      ["Product Name", "Revenue", "Quantity Sold"],
      ...data.topProducts.map((product) => [
        product.name,
        product.revenue,
        product.quantity,
      ]),
    ];

    const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
    
    // Format currency column
    const range = XLSX.utils.decode_range(productsSheet["!ref"] || "A1");
    for (let R = 1; R <= range.e.r; R++) {
      const cellAddress = XLSX.utils.encode_cell({ c: 1, r: R });
      if (productsSheet[cellAddress]) {
        productsSheet[cellAddress].z = `"${data.currency}" #,##0.00`;
      }
    }
    
    applyWorksheetStyling(productsSheet, 0, XLSX);
    setColumnWidths(productsSheet, [40, 18, 15]);
    XLSX.utils.book_append_sheet(workbook, productsSheet, "Top Products");
  }

  // Sheet 4: Sales by Category
  if (data.topCategories && data.topCategories.length > 0) {
    const categoriesData = [
      ["Category", "Sales"],
      ...data.topCategories.map((category) => [
        category.name,
        category.value,
      ]),
    ];

    const categoriesSheet = XLSX.utils.aoa_to_sheet(categoriesData);
    
    // Format currency column
    const range = XLSX.utils.decode_range(categoriesSheet["!ref"] || "A1");
    for (let R = 1; R <= range.e.r; R++) {
      const cellAddress = XLSX.utils.encode_cell({ c: 1, r: R });
      if (categoriesSheet[cellAddress]) {
        categoriesSheet[cellAddress].z = `"${data.currency}" #,##0.00`;
      }
    }
    
    applyWorksheetStyling(categoriesSheet, 0, XLSX);
    setColumnWidths(categoriesSheet, [30, 18]);
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, "Sales by Category");
  }

  // Sheet 5: All Orders
  if (data.allOrders && data.allOrders.length > 0) {
    const ordersData = [
      ["Order Number", "Date", "Customer", "Total", "Status"],
      ...data.allOrders.map((order) => [
        order.number,
        format(new Date(order.date), "PP"),
        order.customer,
        order.total.amount,
        order.status,
      ]),
    ];

    const ordersSheet = XLSX.utils.aoa_to_sheet(ordersData);
    
    // Format currency column
    const range = XLSX.utils.decode_range(ordersSheet["!ref"] || "A1");
    for (let R = 1; R <= range.e.r; R++) {
      const cellAddress = XLSX.utils.encode_cell({ c: 3, r: R });
      if (ordersSheet[cellAddress] && data.allOrders[R - 1]) {
        const currency = data.allOrders[R - 1].total.currency;
        ordersSheet[cellAddress].z = `"${currency}" #,##0.00`;
      }
    }
    
    applyWorksheetStyling(ordersSheet, 0, XLSX);
    setColumnWidths(ordersSheet, [18, 18, 30, 18, 15]);
    XLSX.utils.book_append_sheet(workbook, ordersSheet, "All Orders");
  }

  // Generate filename with date range
  const dateFromStr = format(new Date(data.dateFrom), "yyyy-MM-dd");
  const dateToStr = format(new Date(data.dateTo), "yyyy-MM-dd");
  const channelStr = data.channelName ? `_${data.channelName.replace(/\s+/g, "-")}` : "";
  const filename = `sales-analytics_${dateFromStr}_to_${dateToStr}${channelStr}.xlsx`;

  // Write and download
  XLSX.writeFile(workbook, filename);
}
