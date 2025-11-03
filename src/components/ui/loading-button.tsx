import { Loader2Icon } from "lucide-react";
import { ComponentProps } from "react";

import { Button } from "./button";

type LoadingButtonProps = {
  isLoading: boolean;
} & ComponentProps<typeof Button>;

export const LoadingButton = ({
  isLoading,
  disabled,
  children,
  ...props
}: LoadingButtonProps) => {
  return (
    <Button {...props} disabled={isLoading || disabled}>
      {isLoading ? <Loader2Icon className="animate-spin" /> : children}
    </Button>
  );
};
