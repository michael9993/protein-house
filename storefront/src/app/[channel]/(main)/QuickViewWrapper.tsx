"use client";

import { QuickViewProvider } from "@/providers/QuickViewProvider";

interface QuickViewWrapperProps {
	children: React.ReactNode;
	channel: string;
}

export function QuickViewWrapper({ children, channel }: QuickViewWrapperProps) {
	return <QuickViewProvider channel={channel}>{children}</QuickViewProvider>;
}
