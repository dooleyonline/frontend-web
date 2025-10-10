"use client";

import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/ui";
import { ArrowRightIcon, ChevronLeftIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { memo, useEffect, useState } from "react";

import GridDistortion from "./ui/grid-distortion";

type SiteHeaderProps = {
  isExpanded?: boolean;
};

const SiteHeader = ({ isExpanded = false }: SiteHeaderProps) => {
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();

  return (
    <header
      style={
        isExpanded
          ? isMobile
            ? {
                paddingTop: "60px",
                paddingBottom: "24px",
                borderBottomWidth: "1px",
              }
            : {
                paddingTop: "180px",
                paddingBottom: "24px",
                borderBottomWidth: "1px",
              }
          : {
              paddingTop: "16px",
              paddingBottom: "0px",
              borderBottomWidth: "0px",
            }
      }
      className="border-b px-4 sm:px-6 rounded-b-4xl w-full relative overflow-hidden"
    >
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.3, duration: 1, ease: "easeIn" }}
          className="absolute left-0 top-0 size-full"
        >
          <GridDistortion
            imageSrc="/images/banner.png"
            grid={10}
            mouse={0.1}
            strength={0.5}
            relaxation={0.9}
          />
        </motion.div>
      )}

      {isExpanded && (
        <h1 className="font-display block overflow-hidden leading-none relative z-10 pb-4 pointer-events-none">
          Welcome to DooleyOnline
        </h1>
      )}

      <SearchBar
        isExpanded={isExpanded}
        searchParams={searchParams}
        searchPlaceholder="Search for anything ..."
        className="relative z-10"
      />
    </header>
  );
};

type SearchBarProps = {
  isExpanded: boolean;
  searchPlaceholder: string;
  searchParams: URLSearchParams;
  className?: string;
};

const parseInput = (input: string) => {
  let q = input.trim();
  const category = q.match(/#\w+/g)?.[0];
  if (category) {
    q = q.replace(category, "").trim();
  }

  const params = new URLSearchParams();
  if (!!q) params.set("q", q);
  if (!!category) params.set("category", category.replace("#", ""));

  return params.toString();
};

const SearchBar = memo(
  ({
    searchPlaceholder,
    isExpanded,
    className,
    searchParams,
  }: SearchBarProps) => {
    const router = useRouter();

    const q = searchParams.get("q");
    const category = searchParams.get("category");
    const [input, setInput] = useState("");

    const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      const url = parseInput(input);
      router.push("/?" + url);
    };

    const handleBack = () => {
      setInput("");
      router.back();
    };

    useEffect(() => {
      setInput(`${category ? `#${category}` : ""}${q ? ` ${q}` : ""}`);
    }, [q, category]);

    return (
      <div className={`${className ?? ""} flex items-center w-full`}>
        <AnimatePresence>
          {!isExpanded && (
            <motion.div
              key="modal"
              initial={{ width: "0px", marginRight: "0px" }}
              animate={{ width: "auto", marginRight: "8px" }}
              exit={{ width: "0px", marginRight: "0px" }}
              className="overflow-hidden"
            >
              <Button asChild onClick={handleBack} variant="ghost" size="icon">
                <ChevronLeftIcon className="text-muted-foreground !size-8 sm:!size-9 cursor-pointer" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <form
          onSubmit={handleSearch}
          id="search-bar"
          className="flex items-center gap-2 bg-sidebar rounded-full p-1 sm:p-2 border flex-1 !pl-4 sm:!pl-5"
        >
          <input
            id="search-input"
            type="text"
            placeholder={searchPlaceholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Search"
            className="w-full bg-transparent outline-hidden placeholder:text-muted-foreground"
          />
          <Button
            variant="outline"
            size="icon"
            type="submit"
            disabled={input.trim().length === 0}
            className="rounded-full flex-none"
          >
            <ArrowRightIcon />
          </Button>
        </form>
      </div>
    );
  }
);
SearchBar.displayName = "SearchBar";

export default SiteHeader;
