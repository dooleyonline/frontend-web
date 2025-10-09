"use client"

import { usePathname } from "next/navigation";
import { useMemo } from "react";

export default function useNav() {
  const pathname = usePathname().toLowerCase();

  const { paths, currentPage, isMainPage } = useMemo(() => {
    const lp = pathname.toLowerCase();
    const p = lp.slice(1).split("/");

    if (p[0] !== "" && p[0] !== "_not-found" && !(p[0] in nav)) {
      console.warn(`Unknown page: ${p[0]}`);
    }

    return {
      pathname: lp,
      paths: p,
      currentPage: p[0] === "" ? "home" : (p[0] as keyof typeof nav),
      isMainPage: p.length === 1 && p[0] !== "",
    };
  }, [pathname]);

  return useMemo(
    () => ({
      pathname,
      paths,
      currentPage,
      isMainPage,
      navData: nav[currentPage],
      pages: Object.keys(nav),
    }),
    [pathname, paths, currentPage, isMainPage]
  );
}

const nav: Record<
  string,
  {
    profile: string;
    links: { href: string; title: string; description: string }[];
    button: { href: string; text: string };
  }
> = {
  home: {
    profile: "",
    links: [],
    button: {
      href: "",
      text: "",
    },
  },
  marketplace: {
    profile: "/marketplace/profile",
    links: [
      {
        href: "/marketplace/profile/saved",
        title: "Saved Items",
        description: "View items I've saved for later",
      },
      {
        href: "/marketplace/profile/listing",
        title: "My Listing",
        description: "Edit and track items I've listed for sale",
      },
    ],
    button: {
      href: "/marketplace/new",
      text: "Sell My Stuff",
    },
  },
  living: {
    profile: "/marketplace/profile",
    links: [
      {
        href: "/marketplace/profile/saved",
        title: "Saved Items",
        description: "View items I've saved for later",
      },
      {
        href: "/marketplace/profile/listing",
        title: "My Listing",
        description: "Edit and track items I've listed for sale",
      },
    ],
    button: {
      href: "/marketplace/new",
      text: "New Post",
    },
  },
  forum: {
    profile: "/marketplace/profile",
    links: [
      {
        href: "/marketplace/profile/saved",
        title: "Saved Items",
        description: "View items I've saved for later",
      },
      {
        href: "/marketplace/profile/listing",
        title: "My Listing",
        description: "Edit and track items I've listed for sale",
      },
    ],
    button: {
      href: "/marketplace/new",
      text: "New Post",
    },
  },
};
