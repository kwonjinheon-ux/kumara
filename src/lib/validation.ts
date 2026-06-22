export type RegisterInput = {
  loginId: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
  referralId: string | null;
  acceptedTerms: boolean;
  confirmedAge14: boolean;
  verificationToken: string | null;
  recaptchaToken: string | null;
  profile: {
    profileImageUrl: string | null;
    profileImageScale: number;
    profileImageX: number;
    profileImageY: number;
    smartphoneNumber: string | null;
    kakaoTalkId: string | null;
    bio: string | null;
    city: string | null;
    suburb: string | null;
    showKakaoTalkId: boolean;
    showPhoneNumber: boolean;
    allowChat: boolean;
    interests: string[];
    preferredLanguage: "ko" | "en" | "both";
    notificationComments: boolean;
    notificationSavedPosts: boolean;
    notificationTradeMessages: boolean;
    tradeArea: string | null;
    businessInterested: boolean;
    businessName: string | null;
    businessDescription: string | null;
    residencyStatus: string | null;
    hasCar: boolean | null;
    lifeInfoInterests: string[];
  };
};

export type LoginInput = {
  loginId: string;
  password: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9][0-9\s()-]{6,20}$/;
const nicknamePattern = /^[A-Za-z0-9가-힣_.-]{2,20}$/;
const referralPattern = /^[A-Za-z0-9_.-]{3,30}$/;
const kakaoTalkIdPattern = /^[A-Za-z0-9_.-]{3,30}$/;
const imageSourcePattern = /^(https?:\/\/.+\..+|data:image\/(png|jpeg|jpg|webp);base64,)/;

export function normalizeLoginId(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export function normalizeNickname(value: unknown) {
  return String(value ?? "").trim();
}

export function parseRegisterInput(body: unknown): {
  data?: RegisterInput;
  error?: string;
} {
  const source = body as Partial<RegisterInput>;
  const loginId = normalizeLoginId(source.loginId);
  const password = String(source.password ?? "");
  const passwordConfirm = String(source.passwordConfirm ?? "");
  const nickname = normalizeNickname(source.nickname);
  const referralId = optionalText(source.referralId, 30);
  const acceptedTerms = source.acceptedTerms === true;
  const confirmedAge14 = source.confirmedAge14 === true;
  const verificationToken = optionalText(source.verificationToken, 128);
  const recaptchaToken = optionalText(source.recaptchaToken, 4096);
  const profile = parseOptionalProfile(source);

  if (!loginId) return { error: "이메일을 입력해 주세요." };
  if (!isEmail(loginId)) {
    return { error: "가입은 이메일 주소로만 가능합니다." };
  }
  const passwordError = validateStrongPassword(password);
  if (passwordError) {
    return { error: passwordError };
  }
  if (password !== passwordConfirm) {
    return { error: "비밀번호가 서로 일치하지 않습니다." };
  }
  if (!nicknamePattern.test(nickname)) {
    return { error: "닉네임은 2~20자의 한글, 영문, 숫자, _, ., -만 사용할 수 있습니다." };
  }
  if (referralId && !referralPattern.test(referralId)) {
    return { error: "추천인 ID는 3~30자의 영문, 숫자, _, ., -만 사용할 수 있습니다." };
  }
  if (profile.smartphoneNumber && !isPhone(profile.smartphoneNumber)) {
    return { error: "올바른 스마트폰 번호를 입력해 주세요." };
  }
  if (profile.kakaoTalkId && !kakaoTalkIdPattern.test(profile.kakaoTalkId)) {
    return { error: "카카오톡 ID는 3~30자의 영문, 숫자, _, ., -만 사용할 수 있습니다." };
  }
  if (!acceptedTerms) {
    return { error: "이용약관 및 개인정보 처리방침에 동의해 주세요." };
  }
  if (!confirmedAge14) {
    return { error: "만 14세 이상 확인이 필요합니다." };
  }

  return {
    data: {
      loginId,
      password,
      passwordConfirm,
      nickname,
      referralId,
      acceptedTerms,
      confirmedAge14,
      verificationToken,
      recaptchaToken,
      profile,
    },
  };
}

export function validateStrongPassword(password: string) {
  if (password.length < 10) {
    return "비밀번호는 최소 10자 이상으로 만들어 주세요.";
  }

  const checks = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];

  if (checks.filter(Boolean).length < 3) {
    return "비밀번호는 영문 대문자, 소문자, 숫자, 특수문자 중 3가지 이상을 조합해 주세요.";
  }

  return "";
}

function parseOptionalProfile(source: Record<string, unknown>) {
  const profileImageUrl = optionalText(source.profileImageUrl, 300);

  return {
    profileImageUrl:
      profileImageUrl && imageSourcePattern.test(profileImageUrl)
        ? profileImageUrl
        : null,
    profileImageScale: 1,
    profileImageX: 0,
    profileImageY: 0,
    smartphoneNumber: optionalText(source.smartphoneNumber, 30),
    kakaoTalkId: optionalText(source.kakaoTalkId, 30),
    bio: optionalText(source.bio, 300),
    city: null,
    suburb: null,
    showKakaoTalkId: false,
    showPhoneNumber: false,
    allowChat: true,
    interests: normalizeStringArray(source.interests, 8),
    preferredLanguage: parsePreferredLanguage(source.preferredLanguage),
    notificationComments: source.notificationComments === true,
    notificationSavedPosts: source.notificationSavedPosts === true,
    notificationTradeMessages: source.notificationTradeMessages === true,
    tradeArea: optionalText(source.tradeArea, 80),
    businessInterested: source.businessInterested === true,
    businessName: optionalText(source.businessName, 100),
    businessDescription: optionalText(source.businessDescription, 300),
    residencyStatus: optionalText(source.residencyStatus, 40),
    hasCar:
      source.hasCar === true ? true : source.hasCar === false ? false : null,
    lifeInfoInterests: normalizeStringArray(source.lifeInfoInterests, 8),
  };
}

function optionalText(value: unknown, maxLength: number) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, maxLength) : null;
}

function normalizeStringArray(value: unknown, maxItems: number) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function parsePreferredLanguage(value: unknown): "ko" | "en" | "both" {
  if (value === "en" || value === "both") return value;
  return "ko";
}

export function parseLoginInput(body: unknown): {
  data?: LoginInput;
  error?: string;
} {
  const source = body as Partial<LoginInput>;
  const loginId = normalizeLoginId(source.loginId);
  const password = String(source.password ?? "");

  if (!loginId) return { error: "이메일을 입력해 주세요." };
  if (!isEmail(loginId)) return { error: "이메일 주소로 로그인해 주세요." };
  if (!password) return { error: "비밀번호를 입력해 주세요." };

  return { data: { loginId, password } };
}

export function isEmail(value: string) {
  return emailPattern.test(value);
}

export function isPhone(value: string) {
  return phonePattern.test(value);
}
