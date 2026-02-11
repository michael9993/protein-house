"use client";

import { useState, useEffect, useMemo, useRef } from "react";

interface TimeLeft {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
}

function calcTimeLeft(endDate: Date): TimeLeft | null {
	const diff = endDate.getTime() - Date.now();
	if (diff <= 0) return null;
	return {
		days: Math.floor(diff / (1000 * 60 * 60 * 24)),
		hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
		minutes: Math.floor((diff / (1000 * 60)) % 60),
		seconds: Math.floor((diff / 1000) % 60),
	};
}

interface CountdownTimerProps {
	/** ISO date string or Date for when the countdown ends */
	endDate: string | Date;
	/** Accent color for the timer boxes */
	accentColor?: string;
	/** Compact mode — single row, smaller text */
	compact?: boolean;
	/** Labels for d/h/m/s (for i18n) */
	labels?: { days?: string; hours?: string; minutes?: string; seconds?: string };
	/** Called when the countdown reaches zero */
	onExpire?: () => void;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function CountdownTimer({
	endDate,
	accentColor = "#ef4444",
	compact = false,
	labels,
	onExpire,
}: CountdownTimerProps) {
	const targetTime = useMemo(
		() => (typeof endDate === "string" ? new Date(endDate) : endDate).getTime(),
		[endDate],
	);

	const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
		calcTimeLeft(new Date(targetTime)),
	);

	const onExpireRef = useRef(onExpire);
	useEffect(() => {
		onExpireRef.current = onExpire;
	}, [onExpire]);

	useEffect(() => {
		const target = new Date(targetTime);
		const tick = () => {
			const next = calcTimeLeft(target);
			setTimeLeft(next);
			if (!next) onExpireRef.current?.();
		};
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, [targetTime]);

	if (!timeLeft) return null;

	const d = labels?.days ?? "D";
	const h = labels?.hours ?? "H";
	const m = labels?.minutes ?? "M";
	const s = labels?.seconds ?? "S";

	const units = [
		...(timeLeft.days > 0 ? [{ value: pad(timeLeft.days), label: d }] : []),
		{ value: pad(timeLeft.hours), label: h },
		{ value: pad(timeLeft.minutes), label: m },
		{ value: pad(timeLeft.seconds), label: s },
	];

	if (compact) {
		return (
			<div className="inline-flex items-center gap-1 font-mono text-sm font-bold tabular-nums" style={{ color: accentColor }}>
				{units.map((u, i) => (
					<span key={u.label}>
						{i > 0 && <span className="mx-0.5 opacity-50">:</span>}
						{u.value}
					</span>
				))}
			</div>
		);
	}

	return (
		<div className="inline-flex items-center gap-2" role="timer" aria-live="polite">
			{units.map((u) => (
				<div key={u.label} className="flex flex-col items-center">
					<span
						className="flex h-12 w-12 items-center justify-center rounded-lg text-lg font-black tabular-nums text-white shadow-sm"
						style={{ backgroundColor: accentColor }}
					>
						{u.value}
					</span>
					<span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-neutral-500">
						{u.label}
					</span>
				</div>
			))}
		</div>
	);
}
