export function getRecaptchaSiteKey() {
  return process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";
}

export function isRecaptchaConfigured() {
  return Boolean(process.env.RECAPTCHA_SECRET_KEY);
}

export async function verifyRecaptchaToken(token: unknown, remoteIp?: string) {
  if (!isRecaptchaConfigured()) {
    return { ok: true, skipped: true };
  }

  const normalizedToken = String(token ?? "").trim();
  if (!normalizedToken) {
    return { ok: false, error: "보안 확인을 완료해 주세요." };
  }

  const payload = new URLSearchParams();
  payload.set("secret", process.env.RECAPTCHA_SECRET_KEY ?? "");
  payload.set("response", normalizedToken);
  if (remoteIp) payload.set("remoteip", remoteIp);

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload,
    });
    const result = (await response.json()) as {
      success?: boolean;
      score?: number;
      action?: string;
    };

    if (!result.success) {
      return { ok: false, error: "reCAPTCHA 확인에 실패했습니다." };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "reCAPTCHA 검증 중 오류가 발생했습니다." };
  }
}
