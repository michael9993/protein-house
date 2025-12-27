"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { storeConfig } from "@/config";
import { resendConfirmationEmail } from "./actions";

interface VerifyEmailClientProps {
	channel: string;
	email: string;
	autoResend?: boolean;
}

export function VerifyEmailClient({ channel, email: initialEmail, autoResend }: VerifyEmailClientProps) {
	const router = useRouter();
	const { branding, store } = storeConfig;
	const [email] = useState(initialEmail);
	const [isResending, setIsResending] = useState(false);
	const [resendStatus, setResendStatus] = useState<"idle" | "success" | "error">("idle");
	const [resendMessage, setResendMessage] = useState<string | null>(null);

	// Don't auto-resend - user already received email during registration
	// The resend button is available if they need it

	const handleResend = async () => {
		if (!email) {
			setResendStatus("error");
			setResendMessage("Email address is required");
			return;
		}

		setIsResending(true);
		setResendStatus("idle");
		setResendMessage(null);

		try {
			// Decode email in case it's URL-encoded
			const decodedEmail = decodeURIComponent(email);
			
			console.log("[Resend Confirmation] Calling resendConfirmationEmail for:", decodedEmail);
			
			// Use the no-auth version - just sends email directly without requiring login
			const result = await resendConfirmationEmail(decodedEmail, channel);
			
			console.log("[Resend Confirmation] Result:", {
				success: result.success,
				error: result.error,
			});
			
			if (result.success) {
				setResendStatus("success");
				setResendMessage("Confirmation email sent! Please check your inbox.");
			} else {
				setResendStatus("error");
				// Provide more helpful error message
				let errorMessage = result.error || "Failed to resend confirmation email. Please try again.";
				
				// If error mentions sign in, provide clearer guidance
				if (errorMessage.includes("sign in")) {
					errorMessage = "Unable to resend email automatically. Please sign in first, or wait a few minutes and try again.";
				}
				
				setResendMessage(errorMessage);
			}
		} catch (error) {
			console.error("[Resend Confirmation] Error:", error);
			setResendStatus("error");
			setResendMessage("An error occurred. Please try again later.");
		} finally {
			setIsResending(false);
		}
	};

	return (
		<div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
			<div className="w-full max-w-md">
				{/* Logo */}
				<div className="mb-8 text-center">
					<Link 
						href={`/${channel}`} 
						className="inline-flex items-center gap-2 text-2xl font-bold"
						style={{ color: branding.colors.primary }}
					>
						<svg className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
						</svg>
						{store.name}
					</Link>
					<h1 className="mt-6 text-2xl font-bold text-neutral-900">
						Check Your Email
					</h1>
					<p className="mt-2 text-neutral-600">
						We've sent a confirmation link to your email address
					</p>
				</div>

				{/* Main Content */}
				<div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-neutral-100">
					{/* Email Icon */}
					<div className="mb-6 flex justify-center">
						<div className="rounded-full bg-blue-50 p-4">
							<svg 
								className="h-12 w-12 text-blue-600" 
								fill="none" 
								viewBox="0 0 24 24" 
								stroke="currentColor"
							>
								<path 
									strokeLinecap="round" 
									strokeLinejoin="round" 
									strokeWidth={2} 
									d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
								/>
							</svg>
						</div>
					</div>

					{/* Email Address */}
					{email && (
						<div className="mb-6 text-center">
							<p className="text-sm text-neutral-600">
								We sent a confirmation email to:
							</p>
							<p className="mt-1 text-base font-semibold text-neutral-900">
								{email}
							</p>
						</div>
					)}

					{/* Instructions */}
					<div className="mb-6 space-y-3 text-sm text-neutral-600">
						<p>
							Please click the confirmation link in the email to activate your account.
						</p>
						<p>
							If you don't see the email, check your spam folder or click the button below to resend it.
						</p>
						<div className="mt-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
							<p className="font-medium mb-1">Email not received?</p>
							<p>
								The confirmation email is sent automatically after registration. If you don't see it:
							</p>
							<ul className="mt-1 ml-4 list-disc space-y-1">
								<li>Check your spam/junk folder</li>
								<li>Wait a few minutes (emails may be delayed)</li>
								<li>Sign in below to resend the email</li>
							</ul>
						</div>
					</div>

					{/* Resend Status Messages */}
					{resendStatus === "success" && (
						<div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
							<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
							</svg>
							{resendMessage}
						</div>
					)}

					{resendStatus === "error" && (
						<div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
							<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							{resendMessage}
						</div>
					)}

					{/* Resend Button */}
					{email && (
						<div className="space-y-3">
							<button
								type="button"
								onClick={handleResend}
								disabled={isResending}
								className="w-full rounded-lg px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
								style={{ backgroundColor: branding.colors.primary }}
							>
								{isResending ? "Sending..." : "Resend Confirmation Email"}
							</button>
							{resendStatus === "error" && resendMessage?.includes("sign in") && (
								<div className="space-y-2">
									<p className="text-xs text-center text-neutral-500">
										You need to sign in first to resend the confirmation email.
									</p>
									<Link
										href={`/${channel}/login?email=${encodeURIComponent(email)}&resend=true`}
										className="block w-full rounded-lg border-2 px-4 py-2.5 text-center text-sm font-medium transition-colors hover:bg-neutral-50"
										style={{ 
											borderColor: branding.colors.primary,
											color: branding.colors.primary 
										}}
									>
										Sign In to Resend Email
									</Link>
								</div>
							)}
						</div>
					)}

					{/* Back to Login */}
					<div className="mt-6 text-center">
						<Link
							href={`/${channel}/login`}
							className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
							style={{ color: branding.colors.primary }}
						>
							Back to Sign In
						</Link>
					</div>
				</div>

				{/* Help Text */}
				<div className="mt-6 text-center">
					<p className="text-xs text-neutral-500">
						The confirmation link will expire in 24 hours. If you need help, please contact support.
					</p>
				</div>
			</div>
		</div>
	);
}

