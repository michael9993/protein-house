"use client";

interface Props {
  freeShipping: string;
  securePayment: string;
  easyReturns: string;
}

export function TrustBadges({ freeShipping, securePayment, easyReturns }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4 border-t border-neutral-200 pt-8">
      <div className="flex flex-col items-center gap-1 text-center">
        <svg className="h-6 w-6 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
        <span className="text-xs font-medium text-neutral-600">{freeShipping}</span>
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <svg className="h-6 w-6 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span className="text-xs font-medium text-neutral-600">{securePayment}</span>
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <svg className="h-6 w-6 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="text-xs font-medium text-neutral-600">{easyReturns}</span>
      </div>
    </div>
  );
}
