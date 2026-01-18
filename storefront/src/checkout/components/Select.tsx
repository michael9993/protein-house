import { type SelectHTMLAttributes, type ChangeEvent, type ReactNode, useState } from "react";
import { useField } from "@/checkout/hooks/useForm/useField";

export interface Option<TData extends string = string> {
	label: ReactNode;
	value: TData;
	disabled?: boolean;
	icon?: ReactNode;
	[key: string]: unknown;
}

interface SelectProps<TName extends string, TData extends string>
	extends SelectHTMLAttributes<HTMLSelectElement> {
	name: TName;
	placeholder?: TName;
	label?: ReactNode;
	onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
	options: Option<TData>[];
}

export const Select = <TName extends string, TData extends string>({
	name,
	placeholder,
	onChange,
	options,
	label,
	...rest
}: SelectProps<TName, TData>) => {
	const { error, handleBlur, ...fieldProps } = useField(name);

	const [showPlaceholder, setShowPlaceholder] = useState(!!placeholder);

	const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
		if (!event.currentTarget.value) {
			return;
		}

		setShowPlaceholder(false);
		onChange?.(event);
		fieldProps.onChange(event);
	};

	return (
		<div className="space-y-0.5">
			<label className="flex flex-col">
				<span className="auth-label text-xs">{label}</span>
				<select
					{...fieldProps}
					{...rest}
					onBlur={handleBlur}
					onChange={handleChange}
					className="auth-input mt-1 block w-full rounded-md border shadow-sm focus:outline-none"
				>
					{showPlaceholder && (
						<option disabled value="">
							{placeholder}
						</option>
					)}
					{options.map(({ label, value, disabled = false }) => (
						<option value={value} disabled={disabled} key={label?.toString() + "_" + value}>
							{label}
						</option>
					))}
				</select>
			</label>
			{error && <p className="text-sm" style={{ color: "var(--store-error-text)" }}>{error}</p>}
		</div>
	);
};
