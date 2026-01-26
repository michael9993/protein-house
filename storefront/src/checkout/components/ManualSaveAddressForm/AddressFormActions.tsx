import { Button } from "@/checkout/components/Button";
import { IconButton } from "@/checkout/components/IconButton";
import { TrashIcon } from "@/checkout/ui-kit/icons";
import { useCheckoutText } from "@/checkout/hooks/useCheckoutText";

interface AddressFormActionsProps {
	onDelete?: () => void;
	onCancel: () => void;
	onSubmit: () => void;
	loading: boolean;
	success?: boolean;
}

export const AddressFormActions: React.FC<AddressFormActionsProps> = ({
	onSubmit,
	onDelete,
	onCancel,
	loading,
	success = false,
}) => {
	const text = useCheckoutText();
	
	return (
		<div className="flex flex-row justify-end gap-2">
			{onDelete && (
				<div className="flex">
					<IconButton 
						ariaLabel={text.deleteAddressButton || "Delete address"} 
						onClick={onDelete} 
						icon={<TrashIcon aria-hidden style={{ color: "var(--store-error)" }} className="transition-colors" />} 
					/>
				</div>
			)}

			<Button ariaLabel={text.cancelButton || "Cancel"} variant="secondary" onClick={onCancel} label={text.cancelButton || "Cancel"} />
			{loading ? (
				<Button
					ariaDisabled
					ariaLabel={text.savingAddressText || "Saving address"}
					onClick={(e) => e.preventDefault()}
					label={text.savingAddressText || "Saving…"}
				/>
			) : success ? (
				<Button
					ariaDisabled
					ariaLabel={text.savedText || "Saved"}
					onClick={(e) => e.preventDefault()}
					label={
						<span className="flex items-center gap-2">
							<svg
								className="h-4 w-4"
								style={{ color: "white" }}
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 13l4 4L19 7"
								/>
							</svg>
							{text.savedText || "Saved"}
						</span>
					}
					style={{ backgroundColor: "var(--store-success)", borderColor: "var(--store-success)", color: "white" }}
				/>
			) : (
				<Button ariaLabel={text.saveAddressButton || "Save address"} onClick={onSubmit} label={text.saveAddressButton || "Save address"} />
			)}
		</div>
	);
};
