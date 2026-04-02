/**
 * Pet sizing tables for clothing, collars/harnesses, and beds.
 * Sizes based on pet weight and body measurements.
 */

// -- Pet Clothing sizes --

export interface PetClothingSizeRow {
	size: string;
	weight: string;
	backLength: string;
	chest: string;
	neck: string;
}

export const dogClothingSizes: PetClothingSizeRow[] = [
	{ size: "XS", weight: "Under 3 kg", backLength: "20-25", chest: "30-35", neck: "18-22" },
	{ size: "S", weight: "3-7 kg", backLength: "25-30", chest: "35-42", neck: "22-28" },
	{ size: "M", weight: "7-15 kg", backLength: "30-40", chest: "42-55", neck: "28-36" },
	{ size: "L", weight: "15-25 kg", backLength: "40-50", chest: "55-70", neck: "36-44" },
	{ size: "XL", weight: "25-40 kg", backLength: "50-60", chest: "70-85", neck: "44-52" },
	{ size: "XXL", weight: "40+ kg", backLength: "60-70", chest: "85-100", neck: "52-60" },
];

export const catClothingSizes: PetClothingSizeRow[] = [
	{ size: "XS", weight: "Under 2.5 kg", backLength: "18-22", chest: "28-32", neck: "16-20" },
	{ size: "S", weight: "2.5-4 kg", backLength: "22-26", chest: "32-38", neck: "20-24" },
	{ size: "M", weight: "4-6 kg", backLength: "26-30", chest: "38-44", neck: "24-28" },
	{ size: "L", weight: "6-8 kg", backLength: "30-34", chest: "44-50", neck: "28-32" },
	{ size: "XL", weight: "8+ kg", backLength: "34-38", chest: "50-56", neck: "32-36" },
];

// -- Collar & Harness sizes --

export interface CollarSizeRow {
	size: string;
	weight: string;
	neck: string;
	chest: string;
}

export const dogCollarSizes: CollarSizeRow[] = [
	{ size: "XS", weight: "Under 3 kg", neck: "18-22", chest: "28-35" },
	{ size: "S", weight: "3-7 kg", neck: "22-30", chest: "35-45" },
	{ size: "M", weight: "7-15 kg", neck: "30-40", chest: "45-60" },
	{ size: "L", weight: "15-25 kg", neck: "40-50", chest: "60-75" },
	{ size: "XL", weight: "25-40 kg", neck: "50-60", chest: "75-90" },
	{ size: "XXL", weight: "40+ kg", neck: "60-70", chest: "90-105" },
];

export const catCollarSizes: CollarSizeRow[] = [
	{ size: "S", weight: "Under 3 kg", neck: "16-22", chest: "26-34" },
	{ size: "M", weight: "3-5 kg", neck: "22-28", chest: "34-42" },
	{ size: "L", weight: "5-8 kg", neck: "28-34", chest: "42-50" },
];

// -- Bed sizes --

export interface BedSizeRow {
	size: string;
	weight: string;
	dimensions: string;
	bestFor: string;
}

export const petBedSizes: BedSizeRow[] = [
	{ size: "S", weight: "Under 5 kg", dimensions: "40 x 30", bestFor: "Cats, Chihuahuas, Yorkies" },
	{ size: "M", weight: "5-15 kg", dimensions: "60 x 45", bestFor: "Beagles, Corgis, medium cats" },
	{ size: "L", weight: "15-30 kg", dimensions: "80 x 60", bestFor: "Labradors, Goldens, Boxers" },
	{ size: "XL", weight: "30-45 kg", dimensions: "100 x 75", bestFor: "German Shepherds, Huskies" },
	{ size: "XXL", weight: "45+ kg", dimensions: "120 x 90", bestFor: "Great Danes, Mastiffs" },
];
