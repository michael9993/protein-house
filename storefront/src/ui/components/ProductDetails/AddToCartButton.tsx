"use client";

type ButtonState = "needsSelection" | "outOfStock" | "ready" | "adding" | "added";

interface Props {
  state: ButtonState;
  onClick: () => void;
  primaryColor: string;
  text: {
    selectOptions: string;
    outOfStock: string;
    addToCart: string;
    adding: string;
    addedToCart: string;
  };
}

export function AddToCartButton({ state, onClick, primaryColor, text }: Props) {
  const isDisabled = state === "needsSelection" || state === "outOfStock" || state === "adding";
  const bgColor = state === "added" ? "#059669" : primaryColor;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3.5 text-base font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4"
      style={{ backgroundColor: bgColor }}
    >
      {state === "adding" && (
        <>
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {text.adding}
        </>
      )}
      {state === "added" && (
        <>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {text.addedToCart}
        </>
      )}
      {(state === "ready" || state === "needsSelection" || state === "outOfStock") && (
        <>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {state === "outOfStock"
            ? text.outOfStock
            : state === "needsSelection"
              ? text.selectOptions
              : text.addToCart}
        </>
      )}
    </button>
  );
}
