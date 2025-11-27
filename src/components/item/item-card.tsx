"use client";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/ui";
import type { Item } from "@/lib/types";
import { HeartIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo } from "react";
import TimeAgo from "react-timeago";

import { ItemConditionBadge, ItemNegotiableBadge } from "./item-badge";
import { serverQuery } from "@/lib/api/shared";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { intlFormat } from "date-fns";

type ItemCardProps = {
	item: Item;
};

const ItemCard = memo(({ item }: ItemCardProps) => {
	const link = `/item/${item.id}`;
	const isMobile = useIsMobile();
	const router = useRouter();
	const { data: likedData, refetch: likedRefetch } = useQuery(
		api.user.getLiked(),
	);
	const isLiked = likedData?.includes(item.id) ?? false;

	const handleNavigate = (e: { preventDefault: () => void }) => {
		e.preventDefault();
		if (isMobile) {
			// Skip intercepting route if on mobile
			window.location.href = link;
		} else {
			router.push(link);
		}
	};

	const toggleLike = async () => {
		if (isLiked) {
			await serverQuery(api.item.unlike(item.id));
		} else {
			await serverQuery(api.item.like(item.id));
		}
		await likedRefetch();
	};

	const thumbnail = (
		<Image
			src={item.images?.[0] ?? "/images/fallback.webp"}
			alt={item.name}
			quality={40}
			fill
			loading="lazy"
			placeholder="blur"
			blurDataURL={item.placeholder ?? undefined}
			sizes="(max-width: 640px) 50vw, (max-width: 768px) 20vw, (max-width: 1024px) 18vw, (max-width: 1280px) 15vw, (max-width: 1920) 12vw, 350px"
			className="size-full object-cover cursor-pointer"
		/>
	);

	const info = (
		<>
			<CardHeader className="p-0 block w-full">
				<CardTitle className="text-left m-0 leading-snug font-medium overflow-x-hidden whitespace-nowrap text-ellipsis">
					{item.name}
				</CardTitle>

				<CardDescription className="font-bold text-foreground mt-0! text-base">
					{new Intl.NumberFormat("en-US", {
						style: "currency",
						currency: "USD",
					}).format(item.price)}
				</CardDescription>
			</CardHeader>

			<CardFooter className="p-0">
				<small className="text-muted-foreground">
					<TimeAgo date={item.postedAt} /> · {item.views} views
				</small>
			</CardFooter>
		</>
	);

	const likeButton = (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild onClick={toggleLike}>
					<div className="cursor-pointer backdrop-blur-xs absolute top-2 right-2 rounded-full p-2 bg-foreground/20">
						<HeartIcon
							size={16}
							fill={isLiked ? "#ff5555" : "#ffffff"}
							fillOpacity={0.6}
							strokeWidth={0}
							className="hover:animate-pulse"
						/>
					</div>
				</TooltipTrigger>
				<TooltipContent>
					<p className="text-sm">Like</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);

	const hoverCard = (
		<HoverCardContent className="w-72 flex flex-col gap-2">
			<p className="overflow-hidden whitespace-nowrap text-ellipsis">
				{item.name}
			</p>
			<div className="flex gap-1">
				<ItemConditionBadge condition={item.condition} />
				<ItemNegotiableBadge negotiable={item.isNegotiable} />
			</div>
			<p className="text-sm text-muted-foreground line-clamp-2">
				{item.description}
			</p>
		</HoverCardContent>
	);

	return (
		<HoverCard>
			<HoverCardTrigger asChild className="touch-pan-y !block">
				<Card className="overflow-hidden border-none rounded-md shadow-none p-1 hover:bg-accent relative cursor-pointer">
					<CardContent className="relative overflow-hidden p-0 rounded-md mb-2">
						<Link href={link} prefetch={true} onNavigate={handleNavigate}>
							<AspectRatio ratio={1 / 1} className="w-full relative">
								{thumbnail}
							</AspectRatio>
						</Link>

						{likeButton}
					</CardContent>

					<Link href={link} prefetch={true} onNavigate={handleNavigate}>
						{info}
					</Link>
				</Card>
			</HoverCardTrigger>

			{hoverCard}
		</HoverCard>
	);
});
ItemCard.displayName = "ItemCard";

export default ItemCard;

export const ItemCardSkeleton = () => {
	return (
		<Card className="overflow-hidden border-none rounded-none shadow-none !m-1 !p-0 !block">
			<CardHeader className="relative overflow-hidden !p-0 rounded-md !m-0 !mb-2">
				<AspectRatio ratio={1 / 1} className="w-full">
					<Skeleton className="h-full w-full animate-pulse" />
				</AspectRatio>
			</CardHeader>
			<CardContent className="p-0">
				<Skeleton className="h-4 w-full animate-pulse mb-1" />
				<Skeleton className="h-4 w-16 animate-pulse mb-1" />
			</CardContent>
			<CardFooter className="p-0">
				<Skeleton className="h-4 w-20 animate-pulse" />
			</CardFooter>
		</Card>
	);
};
