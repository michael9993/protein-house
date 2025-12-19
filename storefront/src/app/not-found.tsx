import Link from "next/link";
import { storeConfig } from "@/config";

export default function NotFound() {
  const { branding, store } = storeConfig;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        {/* 404 Illustration */}
        <div className="relative mx-auto mb-8 h-48 w-48">
          <svg
            className="h-full w-full"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Shopping bag with question mark */}
            <rect
              x="40"
              y="60"
              width="120"
              height="120"
              rx="12"
              fill={branding.colors.surface}
              stroke={branding.colors.primary}
              strokeWidth="4"
            />
            <path
              d="M70 60V50C70 33.431 83.431 20 100 20C116.569 20 130 33.431 130 50V60"
              stroke={branding.colors.primary}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <text
              x="100"
              y="140"
              textAnchor="middle"
              fill={branding.colors.primary}
              fontSize="60"
              fontWeight="bold"
              fontFamily="system-ui"
            >
              ?
            </text>
          </svg>
        </div>

        {/* Error Code */}
        <h1 
          className="text-8xl font-bold tracking-tight"
          style={{ color: branding.colors.primary }}
        >
          404
        </h1>

        {/* Message */}
        <h2 className="mt-4 text-2xl font-semibold text-neutral-900">
          Page Not Found
        </h2>
        <p className="mt-3 text-neutral-600">
          Sorry, we couldn't find the page you're looking for.
          <br />
          It might have been moved or doesn't exist.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: branding.colors.primary }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full border-2 px-8 py-3 text-sm font-semibold transition-colors hover:bg-neutral-50"
            style={{ 
              borderColor: branding.colors.primary,
              color: branding.colors.primary,
            }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Browse Products
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 border-t border-neutral-200 pt-8">
          <p className="text-sm text-neutral-500">Or check out these pages:</p>
          <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/categories" className="text-sm font-medium text-neutral-700 hover:underline">
              Categories
            </Link>
            <Link href="/collections" className="text-sm font-medium text-neutral-700 hover:underline">
              Collections
            </Link>
            <Link href="/about" className="text-sm font-medium text-neutral-700 hover:underline">
              About Us
            </Link>
            <Link href="/contact" className="text-sm font-medium text-neutral-700 hover:underline">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

