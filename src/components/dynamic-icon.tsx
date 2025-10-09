"use client";

import { Loader } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import dynamic from "next/dynamic";
import { memo } from "react";

type DynamicIconProps = {
  name: string;
  className?: string;
  [key: string]: unknown;
};

const DynamicIcon = memo(({ name, ...props }: DynamicIconProps) => {
  if (!(name in dynamicIconImports)) {
    console.error(`Icon "${name}" not found in dynamicIconImports.`);
    return <Loader className={props.className} />;
  }

  const Icon = dynamic(
    dynamicIconImports[name as keyof typeof dynamicIconImports],
    {
      ssr: true,
      loading: () => <Loader className={`${props.className} animate-spin`} />,
    }
  );

  return <Icon {...props} />;
});
DynamicIcon.displayName = "DynamicIcon";

export default DynamicIcon;
