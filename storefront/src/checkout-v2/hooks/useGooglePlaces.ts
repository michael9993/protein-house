"use client";

import { useEffect, useRef } from "react";
import type { UseFormSetValue } from "react-hook-form";
import type { AddressFormValues } from "../schemas";

// Access window.google safely without relying on global namespace type
function getGoogleMaps() {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (typeof window !== "undefined" ? (window as any).google : undefined) as
		| typeof google
		| undefined;
}

/**
 * Lazy-loads the Google Maps JS API and attaches Places Autocomplete to the
 * street address input ref. When a place is selected, auto-fills RHF fields.
 *
 * Env: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
 * Progressive enhancement — does nothing if env var is missing.
 */
export function useGooglePlaces(
	inputRef: React.RefObject<HTMLInputElement | null>,
	setValue: UseFormSetValue<AddressFormValues>,
	options?: { componentRestrictions?: google.maps.places.ComponentRestrictions },
) {
	const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
	const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

	useEffect(() => {
		if (!apiKey || !inputRef.current) return;

		const googleMaps = getGoogleMaps();
		// Lazy-load the Google Maps script
		if (!googleMaps?.maps?.places) {
			const script = document.createElement("script");
			script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
			script.async = true;
			script.onload = () => attachAutocomplete();
			document.head.appendChild(script);
		} else {
			attachAutocomplete();
		}

		return () => {
			if (autocompleteRef.current) {
				getGoogleMaps()?.maps.event.clearInstanceListeners(autocompleteRef.current);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [apiKey, inputRef.current]);

	function attachAutocomplete() {
		if (!inputRef.current || autocompleteRef.current) return;
		const googleMaps = getGoogleMaps();
		if (!googleMaps?.maps?.places) return;

		const ac = new googleMaps.maps.places.Autocomplete(inputRef.current, {
			types: ["address"],
			fields: ["address_components", "formatted_address"],
			...options,
		});

		ac.addListener("place_changed", () => handlePlaceChanged(ac.getPlace()));
		autocompleteRef.current = ac;
	}

	function handlePlaceChanged(place: google.maps.places.PlaceResult) {
		const components = place.address_components;
		if (!components) return;

		const get = (type: string, long = true): string =>
			components.find((c) => c.types.includes(type))?.[long ? "long_name" : "short_name"] ?? "";

		const streetNumber = get("street_number");
		const route = get("route");
		const streetAddress1 = [streetNumber, route].filter(Boolean).join(" ");

		const city =
			get("locality") ||
			get("administrative_area_level_2") ||
			get("administrative_area_level_3");

		const countryArea = get("administrative_area_level_1", false); // e.g. "CA" for California
		const postalCode = get("postal_code");
		const countryCode = get("country", false); // ISO 2-letter code

		if (streetAddress1) setValue("streetAddress1", streetAddress1, { shouldValidate: true });
		if (city) setValue("city", city, { shouldValidate: true });
		if (countryArea) setValue("countryArea", countryArea, { shouldValidate: true });
		if (postalCode) setValue("postalCode", postalCode, { shouldValidate: true });
		if (countryCode) setValue("countryCode", countryCode, { shouldValidate: true });
	}
}
