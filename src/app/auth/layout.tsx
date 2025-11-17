"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";

const AuthLayout = ({ children }: PropsWithChildren) => {
  const path = usePathname();
  const isSignIn = path.endsWith("/sign-in");

  return (
    <main className="flex size-full flex-col lg:flex-row items-center gap-4 *:flex-1 *:basis-1">
      <motion.div
        layout
        className={cn(
          isSignIn ? "order-2 lg:order-1" : "order-2",
          "flex w-full justify-center"
        )}
      >
        {children}
      </motion.div>
      <motion.div
        layout
        className={cn(
          "relative size-full rounded-4xl overflow-hidden z-50",
          isSignIn ? "order-1 lg:order-2" : "order-1"
        )}
      >
        {isSignIn ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[url(/images/emory-1.webp)] bg-cover size-full"
          ></motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[url(/images/emory-2.webp)] bg-cover size-full"
          ></motion.div>
        )}
      </motion.div>
    </main>
  );
};

export default AuthLayout;
