import { useState } from "react";
import { NavBar } from "@/modules/ui/NavBar";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { Download, Calendar } from "lucide-react";

export default function ReportsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const summary = trpcClient.reports.monthlySummary.useQuery({ year, month });
  const csvExport = trpcClient.reports.exportCsv.useQuery({ year, month }, { enabled: false });

  async function handleExport() {
    const result = await csvExport.refetch();
    if (result.data?.csv) {
      const blob = new Blob([result.data.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.data.filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div>
      <NavBar />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Tax Reports</h1>
            <p className="text-sm text-text-muted mt-1">Monthly tax summaries for accounting.</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light"
            disabled={csvExport.isFetching}
          >
            <Download size={16} /> Export CSV
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-text-muted" />
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className="border border-border rounded px-3 py-1.5 text-sm"
            >
              {monthNames.map((name, i) => (
                <option key={i + 1} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="border border-border rounded px-3 py-1.5 text-sm"
            >
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="border border-border rounded-lg p-3 bg-white">
            <p className="text-xs text-text-muted">Transactions</p>
            <p className="text-lg font-bold text-text-primary">
              {summary.data?.transactionCount ?? 0}
            </p>
          </div>
          <div className="border border-border rounded-lg p-3 bg-white">
            <p className="text-xs text-text-muted">Net Total</p>
            <p className="text-lg font-bold text-text-primary">
              {summary.data?.totalNet?.toFixed(2) ?? "0.00"}
            </p>
          </div>
          <div className="border border-border rounded-lg p-3 bg-white">
            <p className="text-xs text-text-muted">Gross Total</p>
            <p className="text-lg font-bold text-text-primary">
              {summary.data?.totalGross?.toFixed(2) ?? "0.00"}
            </p>
          </div>
          <div className="border border-border rounded-lg p-3 bg-white">
            <p className="text-xs text-text-muted">Tax Collected</p>
            <p className="text-lg font-bold text-success">
              {summary.data?.totalTax?.toFixed(2) ?? "0.00"}
            </p>
          </div>
        </div>

        {/* Country breakdown */}
        {summary.data?.summary && summary.data.summary.length > 0 ? (
          <div className="border border-border rounded-lg bg-white overflow-x-auto">
            <div className="p-3 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary">Breakdown by Country</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="text-left px-4 py-2 font-medium text-text-muted">Country</th>
                  <th className="text-right px-4 py-2 font-medium text-text-muted">Transactions</th>
                  <th className="text-right px-4 py-2 font-medium text-text-muted">Net</th>
                  <th className="text-right px-4 py-2 font-medium text-text-muted">Gross</th>
                  <th className="text-right px-4 py-2 font-medium text-text-muted">Tax</th>
                  <th className="text-right px-4 py-2 font-medium text-text-muted">Avg Rate</th>
                </tr>
              </thead>
              <tbody>
                {summary.data.summary.map((row) => (
                  <tr key={row.countryCode} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 font-medium">{row.countryCode}</td>
                    <td className="px-4 py-2 text-right">{row.transactionCount}</td>
                    <td className="px-4 py-2 text-right">{row.netTotal.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{row.grossTotal.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-success font-medium">
                      {row.taxTotal.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right">{row.averageRate.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-dashed border-border rounded-lg p-8 text-center">
            <p className="text-sm text-text-muted">
              No transactions recorded for {monthNames[month - 1]} {year}.
            </p>
            <p className="text-xs text-text-muted mt-1">
              Enable transaction logging in the Dashboard to see reports.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
