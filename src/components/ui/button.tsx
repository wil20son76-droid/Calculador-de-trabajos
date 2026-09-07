import Link from "next/link";
import { cn } from "@/lib/utils/cn";

const VARIANTS = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  outline: "border border-slate-300 text-slate-700 hover:bg-slate-50",
  danger: "bg-red-50 text-red-600 hover:bg-red-100",
  ghost: "text-slate-600 hover:bg-slate-100",
};

const SIZES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

type ButtonProps = {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  className?: string;
  href?: string;
} & (
  | ({ href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>)
  | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
);

export function Button({
  variant = "primary",
  size = "md",
  className,
  href,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      />
    );
  }

  return (
    <button
      className={classes}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    />
  );
}
