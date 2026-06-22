type GoogleAuthLinkProps = {
  mode: "login" | "signup";
};

export function GoogleAuthLink({ mode }: GoogleAuthLinkProps) {
  const label = mode === "signup" ? "Google로 회원가입" : "Google로 로그인";

  return (
    <a className="google-auth-link" href={`/api/auth/google?mode=${mode}`}>
      <span className="google-auth-icon" aria-hidden="true">
        G
      </span>
      <span>{label}</span>
    </a>
  );
}
