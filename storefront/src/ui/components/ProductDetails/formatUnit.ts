/**
 * Maps Saleor's MeasurementUnitsEnum values to human-readable labels.
 */
const UNIT_LABELS: Record<string, string> = {
	// Distance
	MM: "mm",
	CM: "cm",
	DM: "dm",
	M: "m",
	KM: "km",
	FT: "ft",
	YD: "yd",
	INCH: "in",
	// Area
	SQ_MM: "mm²",
	SQ_CM: "cm²",
	SQ_DM: "dm²",
	SQ_M: "m²",
	SQ_KM: "km²",
	SQ_FT: "ft²",
	SQ_YD: "yd²",
	SQ_INCH: "in²",
	// Volume
	CUBIC_MILLIMETER: "mm³",
	CUBIC_CENTIMETER: "cm³",
	CUBIC_DECIMETER: "dm³",
	CUBIC_METER: "m³",
	LITER: "L",
	CUBIC_FOOT: "ft³",
	CUBIC_INCH: "in³",
	CUBIC_YARD: "yd³",
	QT: "qt",
	PINT: "pt",
	FL_OZ: "fl oz",
	ACRE_IN: "acre·in",
	ACRE_FT: "acre·ft",
	// Weight
	G: "g",
	LB: "lb",
	OZ: "oz",
	KG: "kg",
	TONNE: "t",
};

export function formatUnit(unit: string | null): string | null {
	if (!unit) return null;
	return UNIT_LABELS[unit] || unit.toLowerCase();
}
