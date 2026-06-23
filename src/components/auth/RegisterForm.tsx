"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { getDownloadURL, ref, uploadString } from "firebase/storage";

import { Button } from "@/components/common/Button";
import { GoogleAuthLink } from "@/components/auth/GoogleAuthLink";
import { termsSections } from "@/config/terms";
import { getFirebaseAuth, getFirebaseStorage } from "@/lib/firebase";
import { upsertFirebaseUserProfile } from "@/lib/firebase-auth-profile";

type FormState = {
  error: string;
  loading: boolean;
};

declare global {
  interface Window {
    korinRegisterRecaptcha?: (token: string) => void;
  }
}

export function RegisterForm() {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ error: "", loading: false });
  const [showOptional, setShowOptional] = useState(false);
  const [profileImage, setProfileImage] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loginId, setLoginId] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [sendingVerification, setSendingVerification] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";
  const isEmailLogin = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginId.trim());
  const passwordMismatch = Boolean(passwordConfirm) && password !== passwordConfirm;

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");

    if (error?.startsWith("google")) {
      setState({
        error: getGoogleAuthError(error),
        loading: false,
      });
    }
  }, []);

  if (typeof window !== "undefined") {
    window.korinRegisterRecaptcha = (token: string) => setRecaptchaToken(token);
  }

  function onProfileImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setProfileImage("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setState({ error: "프로필 사진은 이미지 파일만 업로드할 수 있습니다.", loading: false });
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setState({ error: "프로필 사진은 2MB 이하 이미지만 업로드해 주세요.", loading: false });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfileImage(typeof reader.result === "string" ? reader.result : "");
      setState((current) => ({ ...current, error: "" }));
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ error: "", loading: true });

    if (passwordMismatch) {
      setState({ error: "비밀번호가 서로 일치하지 않습니다.", loading: false });
      return;
    }

    try {
      const form = new FormData(event.currentTarget);
      const email = String(form.get("loginId") ?? "").trim();
      const displayName = String(form.get("nickname") ?? "").trim();
      const credential = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        email,
        String(form.get("password") ?? ""),
      );
      const { user } = credential;
      let photoURL: string | null = null;

      if (profileImage) {
        const imageRef = ref(getFirebaseStorage(), `users/${user.uid}/profile/profile-${Date.now()}.jpg`);
        await uploadString(imageRef, profileImage, "data_url");
        photoURL = await getDownloadURL(imageRef);
      }

      await updateProfile(user, { displayName, photoURL });
      await sendEmailVerification(user);
      await upsertFirebaseUserProfile(user, {
        displayName,
        photoURL,
        extra: {
          profile: {
            bio: String(form.get("bio") ?? "") || null,
            businessDescription: String(form.get("businessDescription") ?? "") || null,
            businessInterested: form.get("businessInterested") === "on",
            businessName: String(form.get("businessName") ?? "") || null,
            hasCar:
              form.get("hasCar") === "yes"
                ? true
                : form.get("hasCar") === "no"
                  ? false
                  : null,
            interests: form.getAll("interests").map(String),
            kakaoTalkId: String(form.get("kakaoTalkId") ?? "") || null,
            lifeInfoInterests: form.getAll("lifeInfoInterests").map(String),
            preferredLanguage: String(form.get("preferredLanguage") ?? "ko"),
            residencyStatus: String(form.get("residencyStatus") ?? "") || null,
            smartphoneNumber: String(form.get("smartphoneNumber") ?? "") || null,
            tradeArea: String(form.get("tradeArea") ?? "") || null,
          },
        },
      });

      router.push("/marketplace");
      router.refresh();
      return;
    } catch (error) {
      setState({
        error: error instanceof Error ? error.message : "회원가입에 실패했습니다.",
        loading: false,
      });
      return;
    }

    if (passwordMismatch) {
      setState({ error: "비밀번호가 서로 일치하지 않습니다.", loading: false });
      return;
    }

    const form = new FormData(event.currentTarget);
    const response = await Promise.resolve({
      ok: false,
      json: async () => ({ error: "Legacy registration path is disabled. Firebase Auth is used above." }),
    });
    void verificationToken;
    void recaptchaToken;
    void profileImage;
    /*
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loginId: form.get("loginId"),
        password: form.get("password"),
        passwordConfirm: form.get("passwordConfirm"),
        nickname: form.get("nickname"),
        referralId: form.get("referralId"),
        acceptedTerms: form.get("acceptedTerms") === "on",
        confirmedAge14: form.get("confirmedAge14") === "on",
        verificationToken,
        recaptchaToken,
        profileImageUrl: profileImage,
        smartphoneNumber: form.get("smartphoneNumber"),
        kakaoTalkId: form.get("kakaoTalkId"),
        bio: form.get("bio"),
        interests: form.getAll("interests"),
        preferredLanguage: form.get("preferredLanguage"),
        notificationComments: form.get("notificationComments") === "on",
        notificationSavedPosts: form.get("notificationSavedPosts") === "on",
        notificationTradeMessages: form.get("notificationTradeMessages") === "on",
        tradeArea: form.get("tradeArea"),
        businessInterested: form.get("businessInterested") === "on",
        businessName: form.get("businessName"),
        businessDescription: form.get("businessDescription"),
        residencyStatus: form.get("residencyStatus"),
        hasCar:
          form.get("hasCar") === "yes"
            ? true
            : form.get("hasCar") === "no"
              ? false
              : null,
        lifeInfoInterests: form.getAll("lifeInfoInterests"),
      }),
    });
    */
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setState({ error: result.error ?? "회원가입에 실패했습니다.", loading: false });
      return;
    }

    router.push("/auth/login");
    router.refresh();
  }

  async function sendVerificationEmail() {
    setState({ error: "", loading: false });
    setVerificationMessage("");

    if (!isEmailLogin) {
      setState({ error: "이메일 인증은 이메일 주소 입력 후 사용할 수 있습니다.", loading: false });
      return;
    }

    setVerificationMessage("회원가입을 완료하면 Firebase 인증 메일이 자동으로 발송됩니다.");
    return;

    setSendingVerification(true);
    const response = await Promise.resolve({
      ok: false,
      json: async () => ({ error: "Firebase sends the verification email after signup." }),
    });
    /*
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginId, recaptchaToken }),
    });
    */
    const result = (await response.json()) as { error?: string; message?: string };
    setSendingVerification(false);

    if (!response.ok) {
      setState({ error: result.error ?? "인증 메일 발송에 실패했습니다.", loading: false });
      return;
    }

    setVerificationMessage(
      result.message ?? "회원가입을 완료하면 Firebase 인증 메일이 자동으로 발송됩니다.",
    );
  }

  async function verifyEmailCode() {
    setState({ error: "", loading: false });

    const response = await Promise.resolve({
      ok: false,
      json: async () => ({ error: "Firebase verifies email through the link in the email." }),
    });
    void emailCode;
    /*
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginId, code: emailCode }),
    });
    */
    const result = (await response.json()) as {
      error?: string;
      message?: string;
      verificationToken?: string;
    };

    if (!response.ok || !result.verificationToken) {
      setState({ error: result.error ?? "이메일 인증에 실패했습니다.", loading: false });
      return;
    }

    setVerificationToken(result.verificationToken);
    setVerificationMessage(result.message ?? "이메일 인증이 완료되었습니다.");
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      {recaptchaSiteKey ? (
        <Script src="https://www.google.com/recaptcha/api.js" strategy="afterInteractive" />
      ) : null}
      <label>
        이메일 *
        <input
          autoComplete="email"
          name="loginId"
          onChange={(event) => {
            setLoginId(event.target.value);
            setVerificationToken("");
            setVerificationMessage("");
          }}
          placeholder="name@example.com"
          required
          type="email"
          value={loginId}
        />
      </label>
      <div className="verification-box required-verification">
        <div className="option-group-title">
          <strong>이메일 인증 *</strong>
          <span>
            스팸 가입을 막기 위해 이메일 인증이 필요합니다.
          </span>
        </div>
        <div className="verification-actions">
          <Button
            disabled={!isEmailLogin || sendingVerification}
            onClick={sendVerificationEmail}
            type="button"
            variant="muted"
          >
            {sendingVerification ? "전송 중..." : "인증 코드 받기"}
          </Button>
        </div>
        {verificationMessage ? (
          <p className="form-success">
            {verificationMessage}
          </p>
        ) : (
          <p className="field-hint">회원가입을 완료하면 Firebase 인증 메일이 발송됩니다. 메일 안의 링크를 눌러 인증을 완료해 주세요.</p>
        )}
      </div>
      <label>
        비밀번호 *
        <input
          autoComplete="new-password"
          minLength={10}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="대소문자, 숫자, 특수문자 조합"
          required
          type="password"
          value={password}
        />
        <span className="field-hint">
          10자 이상, 영문 대문자/소문자/숫자/특수문자 중 3가지 이상 조합을 추천합니다.
        </span>
      </label>
      <label>
        비밀번호 재확인 *
        <input
          autoComplete="new-password"
          minLength={10}
          name="passwordConfirm"
          onChange={(event) => setPasswordConfirm(event.target.value)}
          placeholder="비밀번호를 한 번 더 입력"
          required
          type="password"
          value={passwordConfirm}
        />
        {passwordMismatch ? (
          <span className="field-error">패스워드가 맞지 않습니다.</span>
        ) : null}
      </label>
      <label>
        닉네임 *
        <input
          autoComplete="nickname"
          maxLength={20}
          minLength={2}
          name="nickname"
          placeholder="커뮤니티 표시 이름"
          required
        />
      </label>
      <label>
        추천인 ID
        <input
          autoComplete="off"
          maxLength={30}
          name="referralId"
          placeholder="선택 입력"
        />
      </label>
      <label className="check-row">
        <input name="acceptedTerms" required type="checkbox" />
        <span>
          이용약관 및 개인정보 처리방침에 동의합니다. *
          <button
            className="inline-link-button"
            onClick={() => setShowTerms(true)}
            type="button"
          >
            이용약관 보기
          </button>
        </span>
      </label>
      <label className="check-row">
        <input name="confirmedAge14" required type="checkbox" />
        <span>만 14세 이상입니다. *</span>
      </label>
      <Button
        fullWidth
        onClick={() => setShowOptional((current) => !current)}
        type="button"
        variant="muted"
      >
        선택 정보 {showOptional ? "닫기" : "추가하기"}
      </Button>
      {showOptional ? (
        <fieldset className="optional-fields">
          <legend>선택 정보</legend>
          <label>
            프로필 사진
            <div className="profile-upload">
              <span className="profile-preview">
                {profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="프로필 사진 미리보기" src={profileImage} />
                ) : (
                  <span>사진</span>
                )}
              </span>
              <span className="profile-upload-copy">
                <strong>프로필 사진 선택</strong>
                <span>JPG, PNG, WebP 이미지를 2MB 이하로 올려주세요.</span>
              </span>
              <input
                accept="image/png,image/jpeg,image/webp"
                aria-label="프로필 사진 선택"
                name="profileImageFile"
                onChange={onProfileImageChange}
                type="file"
              />
            </div>
            <span className="field-hint">
              선택 사항이며, 둥근 프로필 이미지로 표시됩니다.
            </span>
          </label>
          <label>
            스마트폰 번호
            <input
              autoComplete="tel"
              name="smartphoneNumber"
              placeholder="예: +64 21 123 4567"
              type="tel"
            />
          </label>
          <label>
            카카오톡 ID
            <input
              autoComplete="off"
              maxLength={30}
              name="kakaoTalkId"
              placeholder="선택 입력"
            />
          </label>
          <label>
            자기소개
            <textarea
              maxLength={300}
              name="bio"
              placeholder="간단한 소개를 입력해 주세요"
              rows={3}
            />
          </label>
          <label>
            언어 선호
            <select name="preferredLanguage" defaultValue="ko">
              <option value="ko">한국어</option>
              <option value="en">English</option>
              <option value="both">한국어 + English</option>
            </select>
          </label>
          <label>
            거래 가능 지역
            <select name="tradeArea">
              <option value="">선택 안 함</option>
              <option value="Auckland CBD">Auckland CBD</option>
              <option value="North Shore">North Shore</option>
              <option value="West Auckland">West Auckland</option>
              <option value="East Auckland">East Auckland</option>
              <option value="South Auckland">South Auckland</option>
              <option value="Hamilton">Hamilton</option>
              <option value="Tauranga">Tauranga</option>
              <option value="Wellington">Wellington</option>
              <option value="Christchurch">Christchurch</option>
              <option value="Dunedin">Dunedin</option>
              <option value="Other">기타 지역</option>
            </select>
          </label>
          <label>
            거주 상태
            <select name="residencyStatus">
              <option value="">선택 안 함</option>
              <option value="student">유학생</option>
              <option value="working_holiday">워홀</option>
              <option value="resident">영주권</option>
              <option value="citizen">시민권</option>
              <option value="other">기타</option>
            </select>
          </label>
          <label>
            차량 보유 여부
            <select name="hasCar">
              <option value="">선택 안 함</option>
              <option value="yes">있음</option>
              <option value="no">없음</option>
            </select>
          </label>
          <div className="option-group">
            <span>관심 카테고리</span>
            <label className="check-row">
              <input name="interests" type="checkbox" value="marketplace" />
              <span>중고거래</span>
            </label>
            <label className="check-row">
              <input name="interests" type="checkbox" value="jobs" />
              <span>구인구직</span>
            </label>
            <label className="check-row">
              <input name="interests" type="checkbox" value="real_estate" />
              <span>렌트/플랫</span>
            </label>
            <label className="check-row">
              <input name="interests" type="checkbox" value="community" />
              <span>커뮤니티</span>
            </label>
          </div>
          <div className="option-group">
            <span>알림 설정</span>
            <label className="check-row">
              <input name="notificationComments" type="checkbox" />
              <span>댓글 알림</span>
            </label>
            <label className="check-row">
              <input name="notificationSavedPosts" type="checkbox" />
              <span>북마크/관심글 알림</span>
            </label>
            <label className="check-row">
              <input name="notificationTradeMessages" type="checkbox" />
              <span>거래 문의 알림</span>
            </label>
          </div>
          <div className="option-group">
            <span>관심 생활정보</span>
            <label className="check-row">
              <input name="lifeInfoInterests" type="checkbox" value="visa" />
              <span>비자</span>
            </label>
            <label className="check-row">
              <input name="lifeInfoInterests" type="checkbox" value="rent" />
              <span>렌트</span>
            </label>
            <label className="check-row">
              <input name="lifeInfoInterests" type="checkbox" value="insurance" />
              <span>보험</span>
            </label>
            <label className="check-row">
              <input name="lifeInfoInterests" type="checkbox" value="school" />
              <span>학교</span>
            </label>
            <label className="check-row">
              <input name="lifeInfoInterests" type="checkbox" value="hospital" />
              <span>병원</span>
            </label>
          </div>
          <label className="check-row">
            <input name="businessInterested" type="checkbox" />
            <span>사업자/업체 기능에 관심이 있습니다</span>
          </label>
          <label>
            업체명
            <input name="businessName" placeholder="사업자 인증 때 사용할 업체명" />
          </label>
          <label>
            업체 소개
            <textarea
              maxLength={300}
              name="businessDescription"
              placeholder="업체 또는 서비스 소개"
              rows={3}
            />
          </label>
        </fieldset>
      ) : null}
      {recaptchaSiteKey ? (
        <div
          className="g-recaptcha"
          data-callback="korinRegisterRecaptcha"
          data-sitekey={recaptchaSiteKey}
        />
      ) : null}
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <Button disabled={state.loading} fullWidth type="submit">
        {state.loading ? "가입 중..." : "가입하기"}
      </Button>
      <div className="auth-divider">
        <span>또는</span>
      </div>
      <GoogleAuthLink mode="signup" />
      {showTerms ? (
        <div
          aria-modal="true"
          className="modal-backdrop"
          onClick={() => setShowTerms(false)}
          role="dialog"
        >
          <div className="terms-modal" onClick={(event) => event.stopPropagation()}>
            <div className="terms-modal__header">
              <div>
                <p className="eyebrow">KumaraMarket.nz rules</p>
                <h2>KumaraMarket.nz 이용약관</h2>
              </div>
              <Button
                aria-label="이용약관 닫기"
                className="modal-close"
                onClick={() => setShowTerms(false)}
                type="button"
                variant="muted"
              >
                ×
              </Button>
            </div>
            <div className="terms-modal__body">
              <p className="terms-notice">
                실제 서비스 적용 전에는 뉴질랜드 법률 검토를 받는 것을 권장합니다.
              </p>
              {termsSections.map((section) => (
                <section key={section.title}>
                  <h3>{section.title}</h3>
                  <p>{section.body}</p>
                </section>
              ))}
            </div>
            <div className="terms-modal__footer">
              <Button
                fullWidth
                onClick={() => setShowTerms(false)}
                type="button"
              >
                확인했습니다
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function getGoogleAuthError(error: string) {
  if (error === "google_config") {
    return "Google 회원가입을 사용하려면 서버에 Google OAuth 설정이 필요합니다.";
  }

  if (error === "google_cancelled") {
    return "Google 회원가입이 취소되었습니다.";
  }

  return "Google 회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}
