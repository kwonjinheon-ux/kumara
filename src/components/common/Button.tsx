import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type ButtonVariant = "primary" | "muted";

type BaseButtonProps = {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  variant?: ButtonVariant;
};

function getButtonClassName({
  className,
  fullWidth,
  variant = "primary",
}: Pick<BaseButtonProps, "className" | "fullWidth" | "variant">) {
  return [
    "button",
    variant === "primary" ? "button-primary" : "button-muted",
    fullWidth ? "full-width" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = BaseButtonProps &
  ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  children,
  className,
  fullWidth = false,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={getButtonClassName({ className, fullWidth, variant })}
      {...props}
    >
      <span className="button__content">{children}</span>
    </button>
  );
}

type ButtonLinkProps = BaseButtonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export function ButtonLink({
  children,
  className,
  fullWidth = false,
  href,
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={getButtonClassName({ className, fullWidth, variant })}
      href={href}
      {...props}
    >
      <span className="button__content">{children}</span>
    </Link>
  );
}
