import { type ReactElement, useState, useEffect } from "react";
import { useUser } from "@/checkout/hooks/useUser";

interface ChildrenProps {
	displayAddressList: boolean;
	displayAddressEdit: boolean;
	displayAddressCreate: boolean;
	setDisplayAddressCreate: (display: boolean) => void;
	setDisplayAddressEdit: (id?: string) => void;
	editedAddressId: string | undefined;
}

interface UserAddressSectionProps {
	children: (props: ChildrenProps) => ReactElement;
}

export const UserAddressSectionContainer = ({ children }: UserAddressSectionProps) => {
	const { user } = useUser();
	const [displayAddressCreate, setDisplayAddressCreate] = useState(false);
	const [editedAddressId, setDisplayAddressEdit] = useState<string | undefined>();

	// Auto-show create form if user has no addresses
	useEffect(() => {
		if (user && (!user.addresses || user.addresses.length === 0) && !displayAddressCreate && !editedAddressId) {
			setDisplayAddressCreate(true);
		}
	}, [user, displayAddressCreate, editedAddressId]);

	const displayAddressEdit = !!editedAddressId;
	const displayAddressList = !displayAddressEdit && !displayAddressCreate;

	const childrenProps = {
		displayAddressList,
		displayAddressEdit,
		displayAddressCreate,
		setDisplayAddressCreate,
		setDisplayAddressEdit,
		editedAddressId,
	};

	return children(childrenProps);
};
