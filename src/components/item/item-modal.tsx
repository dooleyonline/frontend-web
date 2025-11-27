"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HeartIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useMemo } from "react";
import { toast } from "sonner";

import {
	ItemConditionBadge,
	ItemNegotiableBadge,
} from "@/components/item/item-badge";
import ItemCarousel from "@/components/item/item-carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import api from "@/lib/api";
import { Item } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";
import { savePendingChatMessage } from "@/lib/chat/pending-message";

import { Skeleton } from "../ui/skeleton";
import { serverQuery } from "@/lib/api/shared";
import TimeAgo from "react-timeago";

const CHATROOM_ID_PREFIX = "room-";
const getChatroomSlug = (chatroomId: string) => {
	if (
		chatroomId.startsWith(CHATROOM_ID_PREFIX) &&
		chatroomId.length > CHATROOM_ID_PREFIX.length
	) {
		return chatroomId.slice(CHATROOM_ID_PREFIX.length);
	}
	return chatroomId;
};

type ContactSellerInput = {
	sellerId: string;
	buyerId: string;
};

type ItemModalProps = {
	item?: Item | null;
	isLoading?: boolean;
	error?: unknown;
	isPreview?: boolean;
	className?: string;
};

export const ItemModal = memo((props: ItemModalProps) => {
	const { item, isLoading = false, error, isPreview, className } = props;
	const router = useRouter();
	const { user: currentUser } = useUser();
	const queryClient = useQueryClient();
	const chatroomsQueryOptions = useMemo(() => api.chat.getChatrooms(), []);
	const sellerQuery = useQuery({
		...api.user.get(item?.seller ?? ""),
		enabled: Boolean(item?.seller),
	});
	const { data: likedData, refetch: likedRefetch } = useQuery(
		api.user.getLiked(),
	);
	const isLiked = item && likedData ? likedData.includes(item.id) : false;
	const { mutateAsync: ensureChatroomAsync, isPending: isContactingSeller } =
		useMutation({
			mutationFn: async ({ sellerId, buyerId }: ContactSellerInput) => {
				const participantIds = Array.from(new Set([sellerId, buyerId]));
				let chatroomId: string | null = null;

				try {
					const chatrooms = await queryClient.ensureQueryData(
						chatroomsQueryOptions,
					);
					chatroomId =
						chatrooms.find((room) => {
							if (room.isGroup) return false;
							const ids = room.participants.map(
								(participant) => participant.id,
							);
							return participantIds.every((id) => ids.includes(id));
						})?.id ?? null;
				} catch {
					chatroomId = null;
				}

				if (!chatroomId) {
					chatroomId = await api.chat.createChatroom({
						participantIds,
					});
					await queryClient.invalidateQueries({
						queryKey: chatroomsQueryOptions.queryKey,
					});
				}

				return chatroomId;
			},
		});

	if (error) console.error("Error loading item:", error);

	const isOwnListing =
		Boolean(item?.seller) && currentUser?.id === item?.seller;
	const seller = sellerQuery.data ?? null;
	const sellerDisplayName = (() => {
		if (seller) {
			const first = seller.firstName?.trim();
			const last = seller.lastName?.trim();
			const parts = [first, last].filter(Boolean);
			if (parts.length > 0) return parts.join(" ");
			if (seller.email?.trim()) return seller.email.trim();
		}
		return "Seller";
	})();
	const sellerInitials =
		sellerDisplayName
			.split(/\s+/)
			.filter(Boolean)
			.map((part) => part[0]?.toUpperCase() ?? "")
			.join("")
			.slice(0, 2) || "??";

	const handleContactSeller = async () => {
		if (!item?.seller) {
			toast.error("Seller information is unavailable for this item.");
			return;
		}

		if (!currentUser) {
			toast.error("Sign in to contact the seller.");
			router.push("/auth/sign-in");
			return;
		}

		if (currentUser.id === item.seller) {
			toast.error("This is your listing.");
			return;
		}

		try {
			const itemUrl =
				typeof window !== "undefined" && window.location.href
					? window.location.href
					: `/item/${item.id}`;
			const chatroomId = await ensureChatroomAsync({
				buyerId: currentUser.id,
				sellerId: item.seller,
			});
			if (!chatroomId) {
				toast.error("Unable to contact the seller right now.");
				return;
			}
			savePendingChatMessage({
				chatroomId,
				body: itemUrl,
				createdAt: Date.now(),
			});
			const slug = getChatroomSlug(chatroomId);
			router.push(`/chat/${slug}`);
			toast.success("Shared this item with the seller.");
		} catch (chatError) {
			toast.error(
				chatError instanceof Error
					? chatError.message
					: "Failed to contact the seller. Please try again.",
			);
		}
	};

	const toggleLike = async () => {
		if (!item) return;
		if (isLiked) {
			await serverQuery(api.item.unlike(item.id));
		} else {
			await serverQuery(api.item.like(item.id));
		}
		await likedRefetch();
	};

	return (
		<Card className={cn("h-full shadow-none border-none p-0", className)}>
			<CardContent className="h-full p-0 bg-background relative">
				<div
					className={cn(
						"h-full overflow-auto flex flex-col gap-2 pb-14",
						isPreview && "pb-0",
					)}
				>
					<ItemCarousel item={item} isLoading={isLoading} />

					<CardHeader className="text-left p-0 grow mb-2 !block">
						{!item || isLoading ? (
							<Skeleton className="h-8 w-full" />
						) : (
							<CardTitle className="text-2xl font-medium break-words">
								{item.name === "" ? (
									<span className="text-muted-foreground">Item Name</span>
								) : (
									item.name
								)}
							</CardTitle>
						)}
						<div className="flex gap-1 my-2!">
							<ItemConditionBadge
								condition={item?.condition}
								isLoading={isLoading}
							/>
							<ItemNegotiableBadge
								negotiable={item?.isNegotiable}
								isLoading={isLoading}
							/>
						</div>

						<span className="block my-3! text-xl font-semibold">
							{isLoading ? (
								<Skeleton className="h-6 w-20" />
							) : (
								new Intl.NumberFormat("en-US", {
									style: "currency",
									currency: "USD",
								}).format(item?.price ?? 0)
							)}
						</span>

						<CardDescription className="text-secondary-foreground text-base whitespace-pre-line">
							{!item || isLoading ? (
								<>
									<Skeleton className="h-4 w-full my-2" />
									<Skeleton className="h-4 w-full my-2" />
									<Skeleton className="h-4 w-1/3 my-2" />
								</>
							) : item.description === "" ? (
								<span className="text-muted-foreground">Description</span>
							) : (
								item.description
							)}
						</CardDescription>
					</CardHeader>

					<div className="flex gap-2 items-center">
						<Avatar className="size-8">
							<AvatarImage src={seller?.avatar} alt={sellerDisplayName} />
							<AvatarFallback>{sellerInitials}</AvatarFallback>
						</Avatar>

						{!item || isLoading ? (
							<Skeleton className="h-4 w-32" />
						) : (
							<div>
								{sellerQuery.isLoading ? (
									<Skeleton className="h-4 w-24" />
								) : (
									<span className="mr-2 inline-block">{sellerDisplayName}</span>
								)}
								<small className="text-muted-foreground">
									<TimeAgo date={item.postedAt} /> · {item.views} views
								</small>
							</div>
						)}
					</div>
				</div>

				{!isPreview && (
					<CardFooter className="absolute bottom-0 left-0 gap-2 p-0 w-full bg-background">
						<Button
							type="button"
							variant="default"
							size="lg"
							className="flex-1"
							onClick={handleContactSeller}
							disabled={
								isLoading || !item?.seller || isOwnListing || isContactingSeller
							}
						>
							{isContactingSeller ? (
								<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							{isOwnListing ? "You are the seller" : "Contact Seller"}
						</Button>
						<Button
							onClick={toggleLike}
							size="lg"
							variant="outline"
							className="flex-0"
						>
							<HeartIcon
								fill={isLiked ? "#ff5555" : "#ffffff"}
								stroke={isLiked ? "none" : "black"}
							/>
						</Button>
					</CardFooter>
				)}
			</CardContent>
		</Card>
	);
});
ItemModal.displayName = "ItemModal";
