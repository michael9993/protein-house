/**
 * Color utility for generating shade palettes from a single hex color.
 * Used by the theme system to create Tailwind-compatible shade scales
 * (50, 100, 200, 300, 400, 500, 600, 700, 800, 900) from branding colors.
 */

interface HSL {
	h: number;
	s: number;
	l: number;
}

function hexToHSL(hex: string): HSL | null {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) return null;

	const r = parseInt(result[1], 16) / 255;
	const g = parseInt(result[2], 16) / 255;
	const b = parseInt(result[3], 16) / 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;

	if (max === min) return { h: 0, s: 0, l };

	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

	let h: number;
	switch (max) {
		case r:
			h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
			break;
		case g:
			h = ((b - r) / d + 2) / 6;
			break;
		default:
			h = ((r - g) / d + 4) / 6;
			break;
	}

	return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
	const hue2rgb = (p: number, q: number, t: number) => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	};

	let r: number, g: number, b: number;
	if (s === 0) {
		r = g = b = l;
	} else {
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}

	const toHex = (c: number) =>
		Math.round(c * 255)
			.toString(16)
			.padStart(2, "0");

	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Shade lightness targets matching Tailwind's default palette distribution.
 * Maps shade number to target lightness (0-1).
 */
const SHADE_LIGHTNESS: Record<number, number> = {
	50: 0.97,
	100: 0.94,
	200: 0.87,
	300: 0.77,
	400: 0.64,
	500: 0.50,
	600: 0.42,
	700: 0.35,
	800: 0.27,
	900: 0.20,
};

/**
 * Generate a full shade palette from a single hex color.
 * The input color is used as the 500 shade anchor, and other shades
 * are derived by adjusting lightness while preserving hue and saturation.
 */
export function generateShades(hex: string): Record<number, string> {
	const hsl = hexToHSL(hex);
	if (!hsl) return Object.fromEntries(Object.keys(SHADE_LIGHTNESS).map((k) => [Number(k), hex]));

	const shades: Record<number, string> = {};
	for (const [shade, targetL] of Object.entries(SHADE_LIGHTNESS)) {
		// Slightly reduce saturation for very light/dark shades for a more natural look
		const shadeNum = Number(shade);
		let satAdjust = 1;
		if (shadeNum <= 100) satAdjust = 0.7;
		else if (shadeNum <= 200) satAdjust = 0.85;
		else if (shadeNum >= 800) satAdjust = 0.85;
		else if (shadeNum >= 900) satAdjust = 0.7;

		shades[shadeNum] = hslToHex(hsl.h, hsl.s * satAdjust, targetL);
	}

	return shades;
}

/**
 * Generate CSS custom properties for a color's shade palette.
 * e.g., generateShadeVars("success", "#10b981") → { "--store-success-50": "#...", ... }
 */
export function generateShadeVars(
	name: string,
	hex: string,
): Record<string, string> {
	const shades = generateShades(hex);
	const vars: Record<string, string> = {};
	for (const [shade, color] of Object.entries(shades)) {
		vars[`--store-${name}-${shade}`] = color;
	}
	return vars;
}
