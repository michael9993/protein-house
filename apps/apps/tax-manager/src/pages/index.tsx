import { NavBar } from "@/modules/ui/NavBar";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { Shield, Globe, ToggleLeft, ToggleRight } from "lucide-react";

export default function DashboardPage() {
  const globalConfig = trpcClient.channels.getGlobalEnabled.useQuery();
  const channels = trpcClient.channels.list.useQuery();
  const rules = trpcClient.rules.list.useQuery();
  const updateGlobal = trpcClient.channels.updateGlobalEnabled.useMutation({
    onSuccess: () => globalConfig.refetch(),
  });

  const rulesCount = rules.data?.length ?? 0;
  const enabledRules = rules.data?.filter((r) => r.enabled).length ?? 0;
  const channelsCount = channels.data?.length ?? 0;
  const enabledChannels = channels.data?.filter((c) => c.config.enabled).length ?? 0;

  return (
    <div>
      <NavBar />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Tax Manager</h1>
            <p className="text-sm text-text-muted mt-1">
              Self-hosted tax calculation engine with configurable rates
            </p>
          </div>
          <button
            onClick={() =>
              updateGlobal.mutate({ enabled: !globalConfig.data?.enabled })
            }
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              globalConfig.data?.enabled
                ? "bg-success text-white"
                : "bg-gray-200 text-text-muted"
            }`}
            disabled={globalConfig.isLoading}
          >
            {globalConfig.data?.enabled ? (
              <ToggleRight size={18} />
            ) : (
              <ToggleLeft size={18} />
            )}
            {globalConfig.data?.enabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-border rounded-lg p-4 bg-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Shield size={20} className="text-blue-600" />
              </div>
              <span className="text-sm font-medium text-text-muted">Tax Rules</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{enabledRules}</p>
            <p className="text-xs text-text-muted">{rulesCount} total, {enabledRules} enabled</p>
          </div>

          <div className="border border-border rounded-lg p-4 bg-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <Globe size={20} className="text-green-600" />
              </div>
              <span className="text-sm font-medium text-text-muted">Channels</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{enabledChannels}</p>
            <p className="text-xs text-text-muted">{channelsCount} total, {enabledChannels} enabled</p>
          </div>

          <div className="border border-border rounded-lg p-4 bg-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Shield size={20} className="text-purple-600" />
              </div>
              <span className="text-sm font-medium text-text-muted">Status</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {globalConfig.data?.enabled ? "Active" : "Inactive"}
            </p>
            <p className="text-xs text-text-muted">
              {globalConfig.data?.logTransactions ? "Logging enabled" : "Logging disabled"}
            </p>
          </div>
        </div>

        {rules.data && rules.data.length > 0 && (
          <div className="border border-border rounded-lg bg-white">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-text-primary">Recent Rules</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50">
                    <th className="text-left px-4 py-2 font-medium text-text-muted">Name</th>
                    <th className="text-left px-4 py-2 font-medium text-text-muted">Country</th>
                    <th className="text-left px-4 py-2 font-medium text-text-muted">State</th>
                    <th className="text-left px-4 py-2 font-medium text-text-muted">Rate</th>
                    <th className="text-left px-4 py-2 font-medium text-text-muted">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.data.slice(0, 10).map((rule) => (
                    <tr key={rule.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 text-text-primary">{rule.name}</td>
                      <td className="px-4 py-2 text-text-primary">{rule.countryCode}</td>
                      <td className="px-4 py-2 text-text-muted">{rule.countryArea ?? "—"}</td>
                      <td className="px-4 py-2 text-text-primary">{(rule.taxRate * 100).toFixed(2)}%</td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            rule.enabled
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {rule.enabled ? "Active" : "Disabled"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
