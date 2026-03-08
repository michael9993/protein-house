"use client";

import { useComponentStyle, useComponentClasses } from "@/providers/StoreConfigProvider";
import { buildComponentStyle } from "@/config";

export const Overlay = () => {
	const cdStyle = useComponentStyle("ui.imageOverlay");
	const cdClasses = useComponentClasses("ui.imageOverlay");

	return <div data-cd="ui-imageOverlay" className={`fixed inset-0 bg-neutral-500 bg-opacity-75 transition-opacity ${cdClasses}`} style={buildComponentStyle("ui.imageOverlay", cdStyle)}></div>;
};
