// Slot + CVA composition follows shadcn/ui's open component pattern.
// Styling is original to this project; see THIRD_PARTY_NOTICES.md.
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

const buttonStyles = cva("button", {
  variants: {
    variant: {
      primary: "button-primary",
      secondary: "button-secondary",
      ghost: "button-ghost",
    },
    size: { default: "", small: "button-small", icon: "button-icon" },
  },
  defaultVariants: { variant: "secondary", size: "default" },
});

export function Button({
  asChild = false,
  variant,
  size,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> &
  VariantProps<typeof buttonStyles> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}
