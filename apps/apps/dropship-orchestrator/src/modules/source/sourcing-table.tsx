import { Fragment, useMemo } from "react";
import { ChevronDown, ChevronRight, X, Warehouse } from "lucide-react";
import type { SourcedProduct } from "./types";

interface SourcingTableProps {
  products: SourcedProduct[];
  markup: number;
  shippingLoading: boolean;
  warehouseLoading: boolean;
  warehouseStrategy: "cheapest" | "fastest";
  onUpdateProduct: (pid: string, field: keyof SourcedProduct, value: string) => void;
  onRemoveProduct: (pid: string) => void;
  onToggleVariants: (pid: string) => void;
  onSelectWarehouse: (pid: string, origin: string) => void;
}

const inputCls =
  "w-full px-2 py-1 text-xs border border-border rounded focus:outline-none focus:ring-2 focus:ring-brand/20";

const MAIN_COL_COUNT = 7;

export function SourcingTable({
  products,
  markup,
  shippingLoading,
  warehouseLoading,
  warehouseStrategy,
  onUpdateProduct,
  onRemoveProduct,
  onToggleVariants,
  onSelectWarehouse,
}: SourcingTableProps) {
  if (products.length === 0) return null;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="w-8 px-2 py-2 border-b border-border" />
              <th className="text-left px-3 py-2 text-xs font-medium text-text-muted border-b border-border whitespace-nowrap">Image</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-text-muted border-b border-border whitespace-nowrap min-w-[200px]">Name</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-text-muted border-b border-border whitespace-nowrap">Variants</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-text-muted border-b border-border whitespace-nowrap">Cost</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-text-muted border-b border-border whitespace-nowrap">Shipping</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-text-muted border-b border-border whitespace-nowrap">Retail</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <ProductRow
                key={product.pid}
                product={product}
                markup={markup}
                shippingLoading={shippingLoading}
                warehouseLoading={warehouseLoading}
                warehouseStrategy={warehouseStrategy}
                onUpdateProduct={onUpdateProduct}
                onRemoveProduct={onRemoveProduct}
                onToggleVariants={onToggleVariants}
                onSelectWarehouse={onSelectWarehouse}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product row
// ---------------------------------------------------------------------------

function ProductRow({
  product,
  markup,
  shippingLoading,
  warehouseLoading,
  warehouseStrategy,
  onUpdateProduct,
  onRemoveProduct,
  onToggleVariants,
  onSelectWarehouse,
}: {
  product: SourcedProduct;
  markup: number;
  shippingLoading: boolean;
  warehouseLoading: boolean;
  warehouseStrategy: "cheapest" | "fastest";
  onUpdateProduct: (pid: string, field: keyof SourcedProduct, value: string) => void;
  onRemoveProduct: (pid: string) => void;
  onToggleVariants: (pid: string) => void;
  onSelectWarehouse: (pid: string, origin: string) => void;
}) {
  const avgCost =
    product.variants.length > 0
      ? product.variants.reduce((s, v) => s + v.price, 0) / product.variants.length
      : product.costPrice;

  const sortedAttrs = useMemo(() => {
    const names = new Set<string>();
    for (const v of product.variants) {
      for (const key of Object.keys(v.attributes)) names.add(key);
    }
    return Array.from(names).sort((a, b) => {
      if (a === "Color") return -1;
      if (b === "Color") return 1;
      if (a === "Size") return -1;
      if (b === "Size") return 1;
      return a.localeCompare(b);
    });
  }, [product.variants]);

  const hasWarehouses = product.warehouseOptions.length > 1;

  return (
    <Fragment>
      <tr className="align-top hover:bg-gray-50/50">
        {/* Remove button */}
        <td className="px-1 py-2 border-b border-border/50 align-middle">
          <button
            onClick={() => onRemoveProduct(product.pid)}
            className="p-0.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title="Remove product"
          >
            <X size={14} />
          </button>
        </td>
        {/* Image */}
        <td className="px-3 py-2 border-b border-border/50">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.editName}
              className="w-12 h-12 object-cover rounded border border-border"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-[10px] text-text-muted">
              No img
            </div>
          )}
        </td>
        {/* Name */}
        <td className="px-3 py-2 border-b border-border/50">
          <input
            className={inputCls}
            value={product.editName}
            onChange={(e) => onUpdateProduct(product.pid, "editName", e.target.value)}
          />
          {product.supplierName && (
            <div className="text-[10px] text-text-muted mt-0.5">
              {product.supplierName}
              {product.logisticsType !== "COMMON" && (
                <span className="text-error ml-1">[{product.logisticsType}]</span>
              )}
            </div>
          )}
        </td>
        {/* Variants toggle */}
        <td className="px-3 py-2 border-b border-border/50">
          <button
            onClick={() => onToggleVariants(product.pid)}
            className="flex items-center gap-1 px-2 py-0.5 text-xs border border-border rounded hover:bg-gray-100 transition-colors text-brand"
            title="Click to expand variant details"
          >
            {product.showVariants ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            {product.variants.length}
          </button>
        </td>
        {/* Cost */}
        <td className="px-3 py-2 border-b border-border/50 text-sm">${avgCost.toFixed(2)}</td>
        {/* Shipping */}
        <td className="px-3 py-2 border-b border-border/50 text-sm">
          {shippingLoading ? (
            <span className="text-text-muted text-xs">...</span>
          ) : product.shippingCost != null ? (
            <div>
              <span title={`${product.shippingCarrier}${product.shippingDays ? `, ${product.shippingDays}` : ""}`}>
                ${product.shippingCost.toFixed(2)}
              </span>
              {product.shippingDays && (
                <span className="text-[10px] text-text-muted ml-1">({product.shippingDays}d)</span>
              )}
              {/* Warehouse origin badge */}
              {hasWarehouses ? (
                <div className="mt-1">
                  <select
                    className="text-[10px] px-1 py-0.5 border border-border rounded bg-white cursor-pointer"
                    value={product.selectedWarehouse}
                    onChange={(e) => onSelectWarehouse(product.pid, e.target.value)}
                    title="Select shipping warehouse"
                  >
                    {product.warehouseOptions.map((wh) => {
                      const pick = warehouseStrategy === "cheapest" ? wh.cheapest : wh.fastest;
                      return (
                        <option key={wh.origin} value={wh.origin}>
                          {wh.originLabel} {pick ? `- $${pick.cost.toFixed(2)}` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : product.warehouseOptions.length === 1 ? (
                <div className="mt-0.5">
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-text-muted">
                    <Warehouse size={10} />
                    {product.warehouseOptions[0].originLabel}
                  </span>
                </div>
              ) : warehouseLoading ? (
                <div className="mt-0.5 text-[10px] text-text-muted">warehouses...</div>
              ) : null}
            </div>
          ) : (
            <span className="text-text-muted text-xs">N/A</span>
          )}
        </td>
        {/* Retail */}
        <td className="px-3 py-2 border-b border-border/50 text-sm font-semibold">${(avgCost * markup).toFixed(2)}</td>
      </tr>

      {/* Variant sub-table */}
      {product.showVariants && (
        <tr>
          <td colSpan={MAIN_COL_COUNT} className="p-0 border-b-2 border-border bg-gray-50">
            <div className="border-l-[3px] border-brand px-4 py-2 max-h-[400px] overflow-y-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="text-left px-2 py-1 text-[10px] font-semibold text-text-muted border-b border-border whitespace-nowrap">Image</th>
                    <th className="text-left px-2 py-1 text-[10px] font-semibold text-text-muted border-b border-border whitespace-nowrap">SKU</th>
                    {sortedAttrs.map((name) => (
                      <th key={name} className="text-left px-2 py-1 text-[10px] font-semibold text-text-muted border-b border-border whitespace-nowrap">{name}</th>
                    ))}
                    <th className="text-left px-2 py-1 text-[10px] font-semibold text-text-muted border-b border-border whitespace-nowrap">Price</th>
                    <th className="text-left px-2 py-1 text-[10px] font-semibold text-text-muted border-b border-border whitespace-nowrap">Weight</th>
                    <th className="text-left px-2 py-1 text-[10px] font-semibold text-text-muted border-b border-border whitespace-nowrap">Shipping</th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((v) => (
                    <tr key={v.vid} className="hover:bg-gray-100/50">
                      <td className="px-2 py-1 border-b border-border/30 align-middle">
                        {v.image ? (
                          <img src={v.image} alt={v.name} className="w-[30px] h-[30px] object-cover rounded border border-border" />
                        ) : (
                          <span className="text-[10px] text-gray-300">--</span>
                        )}
                      </td>
                      <td className="px-2 py-1 border-b border-border/30 align-middle text-[11px] font-mono text-text-muted">
                        {v.sku || v.vid}
                      </td>
                      {sortedAttrs.map((name) => (
                        <td key={name} className="px-2 py-1 border-b border-border/30 align-middle font-medium">
                          {v.attributes[name] || "-"}
                        </td>
                      ))}
                      <td className="px-2 py-1 border-b border-border/30 align-middle">${v.price.toFixed(2)}</td>
                      <td className="px-2 py-1 border-b border-border/30 align-middle text-text-muted">
                        {v.weight > 0 ? `${v.weight}g` : "-"}
                      </td>
                      <td className="px-2 py-1 border-b border-border/30 align-middle">
                        {shippingLoading ? (
                          <span className="text-text-muted">...</span>
                        ) : v.shippingCost != null ? (
                          <span className="text-error font-medium" title={`${v.shippingCarrier}${v.shippingDays ? `, ${v.shippingDays}` : ""}`}>
                            ${v.shippingCost.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-300">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
}
