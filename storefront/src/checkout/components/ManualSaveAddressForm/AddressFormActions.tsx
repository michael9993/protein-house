import { Button } from "@/checkout/components/Button";
import { IconButton } from "@/checkout/components/IconButton";
import { TrashIcon } from "@/checkout/ui-kit/icons";

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
	return (
		<div className="flex flex-row justify-end gap-2">
			{onDelete && (
				<div className="flex">
					<IconButton 
						ariaLabel="Delete address" 
						onClick={onDelete} 
						icon={<TrashIcon aria-hidden className="text-red-600 hover:text-red-700 transition-colors" />} 
					/>
				</div>
			)}

			<Button ariaLabel="Cancel editing" variant="secondary" onClick={onCancel} label="Cancel" />
			{loading ? (
				<Button
					ariaDisabled
					ariaLabel="Saving address"
					onClick={(e) => e.preventDefault()}
					label="Saving…"
				/>
			) : success ? (
				<Button
					ariaDisabled
					ariaLabel="Address saved"
					onClick={(e) => e.preventDefault()}
					label={
						<span className="flex items-center gap-2">
							<svg
								className="h-4 w-4 text-green-600"
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
							Saved
						</span>
					}
					className="bg-green-600 hover:bg-green-700 text-white border-green-600"
				/>
			) : (
				<Button ariaLabel="Save address" onClick={onSubmit} label="Save address" />
			)}
		</div>
	);
};
