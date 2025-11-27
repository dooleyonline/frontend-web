"use client";

import { ItemTable } from "@/components/item/item-table";
import Section, { SectionHeader } from "@/components/site-section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import api from "@/lib/api";
import { serverQuery } from "@/lib/api/shared";
import { createImageURL, userFullname } from "@/lib/utils";
import {
	keepPreviousData,
	useInfiniteQuery,
	useQuery,
} from "@tanstack/react-query";
import { PenIcon, Trash2Icon } from "lucide-react";
import { ChangeEventHandler, useEffect } from "react";
import { toast } from "sonner";

const ProfilePage = () => {
	const { user } = useUser();

	const myItems = useInfiniteQuery({
		queryKey: ["my-items"],
		queryFn: async ({ pageParam }) => {
			if (!user) return;
			const { data, error } = await serverQuery(
				api.item.getMany({ seller: user.id, page: pageParam }),
			);
			if (error) throw error;
			return data;
		},
		enabled: !!user,
		initialPageParam: 1,
		placeholderData: keepPreviousData,
		getNextPageParam: (lastPage, allPages) => {
			if (!lastPage || lastPage?.length === 0) {
				return undefined;
			}
			return allPages.length + 1;
		},
	});
	const { data: likedIDsData } = useQuery(api.user.getLiked());
	const { data: likedItemsData } = useQuery({
		...api.item.getBatch(likedIDsData ?? []),
		enabled: !!likedIDsData,
	});

	useEffect(() => {
		if (myItems.hasNextPage) {
			myItems.fetchNextPage();
		}
	}, [myItems]);

	if (!user) return null;
	const myItemsData = myItems.data?.pages.flat().filter((item) => !!item);

	return (
		<main className="container mx-auto space-y-10">
			<div className="flex items-center gap-10">
				<ProfileAvatar />
				<div>
					<h2 className="text-3xl">{userFullname(user)}</h2>
					<div>
						<span className="text-muted-foreground">{user.email}</span>
					</div>
				</div>
			</div>

			<Section id="my-items">
				<SectionHeader title="My Items" />
				{myItemsData && <ItemTable data={myItemsData} />}
			</Section>

			<Section id="liked-items">
				<SectionHeader title="Liked Items" />
				{likedItemsData && <ItemTable data={likedItemsData} />}
			</Section>
		</main>
	);
};

export default ProfilePage;

const ProfileAvatar = () => {
	const { user, revalidate } = useUser();

	const handleUpdate: ChangeEventHandler<HTMLInputElement> = (e) => {
		const callback = async () => {
			const file = e.target.files?.item(0);
			if (!file || !user) return;
			await serverQuery(api.user.updateAvatar(user, file));
			await revalidate();
		};
		toast.promise(callback(), {
			loading: "Updating avatar",
			success: "Successfully updated avatar",
			error: "Failed to update avatar",
		});
	};

	const handleDelete = () => {
		const callback = async () => {
			if (!user) return;
			await serverQuery(
				api.user.update({
					...user,
					avatar: "00000000-0000-0000-0000-000000000000",
				}),
			);
			await revalidate();
		};
		toast.promise(callback(), {
			loading: "Removing avatar",
			success: "Successfully removed avatar",
			error: "Failed to remove avatar",
		});
	};

	return (
		<div className="relative">
			<Avatar className="size-80 border">
				<AvatarImage src={user?.avatar} />
				<AvatarFallback />
			</Avatar>
			<div className="absolute bottom-0 left-1/2 translate-y-1/2 -translate-x-1/2 space-x-1">
				<Button variant="outline" size="icon" asChild className="rounded-full">
					<label htmlFor="avatar-input">
						<PenIcon />
					</label>
				</Button>
				<Button
					variant="destructive"
					size="icon"
					onClick={handleDelete}
					className="rounded-full"
				>
					<Trash2Icon />
				</Button>
			</div>
			<input
				id="avatar-input"
				type="file"
				onChange={handleUpdate}
				className="hidden"
			/>
		</div>
	);
};
