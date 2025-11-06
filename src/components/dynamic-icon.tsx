"use client";

import { Loader } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import dynamic from "next/dynamic";
import { ComponentType, memo } from "react";

type DynamicIconProps = {
  name: string;
  className?: string;
  [key: string]: unknown;
};

type DynamicIconComponent = ComponentType<Omit<DynamicIconProps, "name">>;

const dynamicIconComponents = Object.fromEntries(
  Object.entries(dynamicIconImports).map(([iconName, importFn]) => [
    iconName,
    dynamic(importFn, {
      ssr: true,
      loading: () => <Loader className="h-4 w-4 animate-spin" />,
    }),
  ]),
) as Record<string, DynamicIconComponent>;

const DynamicIcon = memo(({ name, className, ...props }: DynamicIconProps) => {
  const IconComponent = dynamicIconComponents[name];
  if (!IconComponent) {
    console.error(`Icon "${name}" not found in dynamicIconImports.`);
    return <Loader className={`${className ?? ""} animate-spin`} />;
  }

  return <IconComponent className={className} {...props} />;
});
DynamicIcon.displayName = "DynamicIcon";

export default DynamicIcon;
