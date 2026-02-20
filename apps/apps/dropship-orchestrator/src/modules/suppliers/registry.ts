import { createLogger } from "@/logger";

import { AliExpressAdapter } from "./aliexpress/adapter";
import { CJAdapter } from "./cj/adapter";
import type { SupplierAdapter } from "./types";

const logger = createLogger("SupplierRegistry");

/**
 * Singleton registry that holds all registered supplier adapters.
 * Adapters register themselves at module-load time and can be looked up by id.
 */
class SupplierRegistry {
  private readonly adapters: Map<string, SupplierAdapter> = new Map();
  private readonly disabledSuppliers: Set<string> = new Set();

  registerAdapter(adapter: SupplierAdapter): void {
    if (this.adapters.has(adapter.id)) {
      logger.warn(`Adapter "${adapter.id}" is already registered — overwriting`);
    }

    this.adapters.set(adapter.id, adapter);
    logger.info(`Registered supplier adapter: ${adapter.name} (${adapter.id})`);
  }

  getAdapter(supplierId: string): SupplierAdapter | null {
    return this.adapters.get(supplierId) ?? null;
  }

  getAllAdapters(): SupplierAdapter[] {
    return Array.from(this.adapters.values());
  }

  isSupplierEnabled(supplierId: string): boolean {
    if (this.disabledSuppliers.has(supplierId)) {
      return false;
    }

    return this.adapters.has(supplierId);
  }

  enableSupplier(supplierId: string): void {
    this.disabledSuppliers.delete(supplierId);
    logger.info(`Enabled supplier: ${supplierId}`);
  }

  disableSupplier(supplierId: string): void {
    this.disabledSuppliers.add(supplierId);
    logger.info(`Disabled supplier: ${supplierId}`);
  }

  /** Remove all adapters — primarily useful in tests. */
  clear(): void {
    this.adapters.clear();
    this.disabledSuppliers.clear();
  }
}

/** The global singleton instance used throughout the application. */
export const supplierRegistry = new SupplierRegistry();

// Re-export convenience functions bound to the singleton.
export const getAdapter = (supplierId: string) => supplierRegistry.getAdapter(supplierId);
export const registerAdapter = (adapter: SupplierAdapter) => supplierRegistry.registerAdapter(adapter);
export const getAllAdapters = () => supplierRegistry.getAllAdapters();
export const isSupplierEnabled = (supplierId: string) => supplierRegistry.isSupplierEnabled(supplierId);

// ---------------------------------------------------------------------------
// Auto-register built-in adapters at module load time.
// ---------------------------------------------------------------------------
supplierRegistry.registerAdapter(new AliExpressAdapter());
supplierRegistry.registerAdapter(new CJAdapter());
