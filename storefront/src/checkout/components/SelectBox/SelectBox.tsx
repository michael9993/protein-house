import clsx from "clsx";
import { type HTMLAttributes } from "react";
import { useField } from "formik";
import { type Children, type Classes } from "@/checkout/lib/globalTypes";
import { useFormContext } from "@/checkout/hooks/useForm";

export interface SelectBoxProps<TFieldName extends string>
	extends Classes,
		Children,
		Omit<HTMLAttributes<HTMLInputElement>, "children"> {
	disabled?: boolean;
	name: TFieldName;
	value: string;
}

export const SelectBox = <TFieldName extends string>({
	children,
	className,
	disabled = false,
	name,
	value,
}: SelectBoxProps<TFieldName>) => {
	const { values, handleChange } = useFormContext<Record<TFieldName, string>>();
	const [field] = useField(name);
	const selected = values[name] === value;

	return (
		<label
			className={clsx(
				"relative mb-2 flex cursor-pointer flex-row items-center justify-start rounded border px-3 py-2",
				{ "pointer-events-none": disabled },
				className,
			)}
			style={{ 
				borderColor: selected ? "var(--store-primary)" : "var(--store-neutral-400)",
				backgroundColor: selected ? "var(--store-primary-light)" : undefined
			}}
		>
			<input
				type="radio"
				{...field}
				onChange={handleChange}
				value={value}
				checked={selected}
				className="rounded-full shadow-sm"
				style={{ borderColor: "var(--store-neutral-300)", color: "var(--store-primary)" }}
			/>
			<span className="ml-2 block w-full">{children}</span>
		</label>
	);
};
