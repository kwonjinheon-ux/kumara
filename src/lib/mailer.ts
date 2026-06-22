import nodemailer from "nodemailer";

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendVerificationEmail(input: {
  email: string;
  code: string;
  expiresInMinutes: number;
}) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const previewText = `KumaraMarket.nz 이메일 인증 코드 ${input.code}`;
  const html = `
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>KumaraMarket.nz 이메일 인증</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f8fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Apple SD Gothic Neo','Noto Sans KR',Arial,sans-serif;color:#172033;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${previewText}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f8fc;margin:0;padding:32px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #d9e8f4;border-radius:22px;overflow:hidden;box-shadow:0 18px 46px rgba(18,54,84,0.10);">
            <tr>
              <td style="padding:0;background:#2388d9;">
                <div style="height:7px;background:linear-gradient(90deg,#56b4ff 0%,#2388d9 46%,#8bd7ff 100%);"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 34px 22px;">
                <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:#eaf6ff;color:#1265a8;font-size:12px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;">
                  KumaraMarket.nz Email Verification
                </div>
                <h1 style="margin:18px 0 10px;font-size:28px;line-height:1.25;color:#101928;font-weight:900;letter-spacing:0;">
                  이메일 인증 코드를 확인해 주세요
                </h1>
                <p style="margin:0;color:#526173;font-size:15px;line-height:1.7;font-weight:600;">
                  KumaraMarket.nz 가입을 계속하려면 아래 6자리 코드를 회원가입 화면에 입력해 주세요.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 34px 26px;">
                <div style="background:#f7fbff;border:1px solid #cfe8fb;border-radius:18px;padding:24px;text-align:center;">
                  <p style="margin:0 0 12px;color:#526173;font-size:13px;font-weight:800;">
                    인증 코드
                  </p>
                  <div style="display:inline-block;background:#ffffff;border:1px solid #badcf5;border-radius:16px;padding:16px 22px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.95);">
                    <span style="font-size:36px;line-height:1;color:#0f6fbd;font-weight:900;letter-spacing:8px;font-family:'SFMono-Regular',Consolas,'Liberation Mono',monospace;">
                      ${input.code}
                    </span>
                  </div>
                  <p style="margin:16px 0 0;color:#415265;font-size:14px;line-height:1.6;font-weight:700;">
                    이 코드는 ${input.expiresInMinutes}분 동안만 사용할 수 있습니다.
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 34px 34px;">
                <div style="border-top:1px solid #e8eff5;padding-top:20px;">
                  <p style="margin:0 0 8px;color:#172033;font-size:14px;line-height:1.6;font-weight:800;">
                    보안 안내
                  </p>
                  <p style="margin:0;color:#6a7788;font-size:13px;line-height:1.7;font-weight:600;">
                    본인이 요청하지 않았다면 이 메일을 무시해 주세요. Korin은 이메일 인증 코드를 비밀번호처럼 직접 묻지 않습니다.
                  </p>
                </div>
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0;color:#8391a3;font-size:12px;line-height:1.6;font-weight:600;">
            KumaraMarket.nz · New Zealand Korean Community Platform
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  await transporter.sendMail({
    from,
    to: input.email,
    subject: "[KumaraMarket.nz] 이메일 인증 코드",
    html,
    text: [
      "안녕하세요. KumaraMarket.nz 이메일 인증 코드입니다.",
      "",
      `인증 코드: ${input.code}`,
      `유효 시간: ${input.expiresInMinutes}분`,
      "",
      "본인이 요청하지 않았다면 이 메일을 무시해 주세요.",
    ].join("\n"),
  });
}

export async function sendPasswordResetEmail(input: {
  email: string;
  resetUrl: string;
  expiresInMinutes: number;
}) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const html = `
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>KumaraMarket.nz 비밀번호 재설정</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f8fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Apple SD Gothic Neo','Noto Sans KR',Arial,sans-serif;color:#172033;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      KumaraMarket.nz 비밀번호 재설정 링크가 도착했습니다.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f8fc;margin:0;padding:32px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #d9e8f4;border-radius:22px;overflow:hidden;box-shadow:0 18px 46px rgba(18,54,84,0.10);">
            <tr>
              <td style="padding:0;background:#2388d9;">
                <div style="height:7px;background:linear-gradient(90deg,#56b4ff 0%,#2388d9 46%,#8bd7ff 100%);"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 34px 22px;">
                <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:#eaf6ff;color:#1265a8;font-size:12px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;">
                  KumaraMarket.nz Password Reset
                </div>
                <h1 style="margin:18px 0 10px;font-size:28px;line-height:1.25;color:#101928;font-weight:900;letter-spacing:0;">
                  새 비밀번호를 설정해 주세요
                </h1>
                <p style="margin:0;color:#526173;font-size:15px;line-height:1.7;font-weight:600;">
                  아래 버튼을 누르면 KumaraMarket.nz 비밀번호 재설정 화면으로 이동합니다.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 34px 28px;">
                <a href="${input.resetUrl}" style="background:linear-gradient(135deg,#55c4ff 0%,#2388d9 54%,#126fba 100%);border-radius:999px;color:#ffffff;display:inline-block;font-size:16px;font-weight:900;line-height:1;padding:16px 26px;text-decoration:none;">
                  비밀번호 재설정하기
                </a>
                <p style="margin:18px 0 0;color:#415265;font-size:14px;line-height:1.6;font-weight:700;">
                  이 링크는 ${input.expiresInMinutes}분 동안만 사용할 수 있습니다.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 34px 34px;">
                <div style="background:#f7fbff;border:1px solid #d4e9f8;border-radius:16px;padding:16px;">
                  <p style="margin:0 0 8px;color:#172033;font-size:14px;line-height:1.6;font-weight:800;">
                    버튼이 열리지 않나요?
                  </p>
                  <p style="margin:0;color:#6a7788;font-size:13px;line-height:1.7;font-weight:600;word-break:break-all;">
                    ${input.resetUrl}
                  </p>
                </div>
                <p style="margin:18px 0 0;color:#6a7788;font-size:13px;line-height:1.7;font-weight:600;">
                  본인이 요청하지 않았다면 이 메일을 무시해 주세요. 기존 비밀번호는 유지됩니다.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0;color:#8391a3;font-size:12px;line-height:1.6;font-weight:600;">
            KumaraMarket.nz · New Zealand Korean Community Platform
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  await transporter.sendMail({
    from,
    to: input.email,
    subject: "[KumaraMarket.nz] 비밀번호 재설정",
    html,
    text: [
      "안녕하세요. KumaraMarket.nz 비밀번호 재설정 링크입니다.",
      "",
      input.resetUrl,
      "",
      `유효 시간: ${input.expiresInMinutes}분`,
      "",
      "본인이 요청하지 않았다면 이 메일을 무시해 주세요.",
    ].join("\n"),
  });
}
