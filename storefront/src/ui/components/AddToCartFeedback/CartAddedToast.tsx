"use client";

interface CartAddedToastProps {
  productName: string;
  productImage?: string | null;
  quantity: number;
  onViewCart: () => void;
  viewCartText?: string;
}

/**
 * Rich toast content showing product thumbnail + name + View Cart button.
 * Rendered inside the custom ToastContainer via the `content` slot.
 */
export function CartAddedToast({
  productName,
  productImage,
  quantity,
  onViewCart,
  viewCartText = "View Cart",
}: CartAddedToastProps) {
  return (
    <div className="flex items-center gap-3 pt-1">
      {productImage && (
        <img
          src={productImage}
          alt=""
          className="h-10 w-10 flex-shrink-0 rounded-md border border-neutral-100 object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-neutral-600">
          {quantity > 1 ? `${quantity}x ` : ""}
          {productName}
        </p>
      </div>
      <button
        type="button"
        onClick={onViewCart}
        className="flex-shrink-0 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-700"
      >
        {viewCartText}
      </button>
    </div>
  );
}
