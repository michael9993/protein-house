"use client";

import { type UserDetailsFragment } from "@/gql/graphql";
import { useBranding } from "@/providers/StoreConfigProvider";

type Props = {
	user: UserDetailsFragment;
};

export const UserInfo = ({ user }: Props) => {
	const branding = useBranding();
	const userName = user.firstName && user.lastName 
		? `${user.firstName} ${user.lastName}` 
		: null;

	const initials = userName
		? `${user.firstName![0]}${user.lastName![0]}`
		: user.email.slice(0, 2).toUpperCase();

	return (
		<div className="flex items-center gap-3">
			{/* Avatar */}
			{user.avatar?.url ? (
				<img
					src={user.avatar.url}
					alt={user.avatar.alt || userName || user.email}
					className="h-10 w-10 rounded-full object-cover ring-2 ring-neutral-100"
				/>
			) : (
				<div 
					className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
					style={{ backgroundColor: branding.colors.primary }}
				>
					{initials}
				</div>
			)}
			
			{/* Info */}
			<div className="min-w-0">
				{userName && (
					<p className="truncate text-sm font-semibold text-neutral-900">
						{userName}
					</p>
				)}
				<p className="truncate text-xs text-neutral-500">
					{user.email}
				</p>
			</div>
		</div>
	);
};
