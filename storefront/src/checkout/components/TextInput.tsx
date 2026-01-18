import { type AllHTMLAttributes } from "react";
import clsx from "clsx";
import { Field, type FieldProps } from "formik";

export interface TextInputProps<TName extends string> extends AllHTMLAttributes<HTMLInputElement> {
	name: TName;
	label: string;
}

export const TextInput = <TName extends string>(props: TextInputProps<TName>) => (
	<Field {...props} component={TextInputComponent} />
);

export const TextInputComponent = <TName extends string>({
	field,
	form: { touched, errors },
	label,
	required,
	...props
}: TextInputProps<TName> & FieldProps) => {
	const error = touched[field.name] ? (errors[field.name] as string) : undefined;

	return (
		<div className="space-y-0.5">
			<label className="flex flex-col">
				<span className="auth-label text-xs">
					{label}
					{required && <span aria-hidden="true">*</span>}
				</span>
				<input
					required={required}
					spellCheck={false}
					{...field}
					{...props}
					className={clsx(
						"auth-input mt-0.5 w-full appearance-none rounded-md border shadow-sm transition-colors focus:outline-none",
						{ "!border-[var(--store-error-border)]": error },
						props.className,
					)}
				/>
			</label>
			{error && <p className="text-sm" style={{ color: "var(--store-error-text)" }}>{error}</p>}
		</div>
	);
};
