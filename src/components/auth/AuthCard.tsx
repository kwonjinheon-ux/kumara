import type { ReactNode } from "react";

type AuthCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
};

export function AuthCard({
  eyebrow,
  title,
  description,
  footer,
  children,
}: AuthCardProps) {
  return (
    <section className="auth-card">
      <div className="auth-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
      <p className="auth-footer">{footer}</p>
    </section>
  );
}
