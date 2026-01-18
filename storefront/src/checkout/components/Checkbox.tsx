import React from "react";
import { useField } from "formik";
import { useFormContext } from "@/checkout/hooks/useForm";

interface CheckboxProps<TName extends string> {
	name: TName;
	label: string;
}

export const Checkbox = <TName extends string>({ name, label }: CheckboxProps<TName>) => {
	const { handleChange } = useFormContext<Record<TName, string>>();
	const [field, { value }] = useField<boolean>(name);

	return (
		<label className="inline-flex items-center gap-x-2">
			<input
				{...field}
				value={field.value as unknown as string}
				name={name}
				checked={value}
				onChange={(event) => {
					handleChange({ ...event, target: { ...event.target, name, value: !value } });
				}}
				type="checkbox"
				className="rounded shadow-sm focus:outline-none focus:ring focus:ring-opacity-50 focus:ring-offset-0"
				style={{
					borderColor: "var(--store-neutral-300)",
					color: "var(--store-primary)",
				}}
			/>
			<span style={{ color: "var(--store-text)" }}>{label}</span>
		</label>
	);
};
