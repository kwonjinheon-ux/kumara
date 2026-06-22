"use client";

import { sendEmailVerification } from "firebase/auth";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/common/Button";
import { getFirebaseStorage, getFirestoreDb } from "@/lib/firebase";

export default function MyPage() {
  const { firebaseUser, loading, profile, refreshProfile } = useAuth();
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function resendVerification() {
    if (!firebaseUser) return;
    await sendEmailVerification(firebaseUser);
    setMessage("인증 메일을 다시 보냈습니다.");
  }

  async function onProfileImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!firebaseUser || !file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== "string") return;
      const imageRef = ref(getFirebaseStorage(), `users/${firebaseUser.uid}/profile/profile-${Date.now()}`);
      await uploadString(imageRef, reader.result, "data_url");
      const photoURL = await getDownloadURL(imageRef);
      await updateDoc(doc(getFirestoreDb(), "users", firebaseUser.uid), {
        photoURL,
        updatedAt: serverTimestamp(),
      });
      await refreshProfile();
      setUploading(false);
      setMessage("프로필 이미지가 저장되었습니다.");
    };
    reader.readAsDataURL(file);
  }

  if (loading) return <main className="my-page">Loading...</main>;

  if (!firebaseUser) {
    return (
      <main className="my-page">
        <p className="form-error">로그인이 필요합니다.</p>
      </main>
    );
  }

  return (
    <main className="my-page">
      <section className="my-dashboard">
        <div className="my-profile-card">
          <h1>마이페이지</h1>
          <dl>
            <div>
              <dt>UID</dt>
              <dd>{firebaseUser.uid}</dd>
            </div>
            <div>
              <dt>이메일</dt>
              <dd>{firebaseUser.email}</dd>
            </div>
            <div>
              <dt>닉네임</dt>
              <dd>{profile?.displayName ?? firebaseUser.displayName}</dd>
            </div>
            <div>
              <dt>이메일 인증</dt>
              <dd>{firebaseUser.emailVerified ? "인증됨" : "미인증"}</dd>
            </div>
          </dl>
          <label>
            프로필 이미지
            <input accept="image/*" disabled={uploading} onChange={onProfileImageChange} type="file" />
          </label>
          {!firebaseUser.emailVerified ? (
            <Button onClick={() => void resendVerification()} type="button">
              인증 메일 다시 보내기
            </Button>
          ) : null}
          {message ? <p className="form-success">{message}</p> : null}
        </div>
      </section>
    </main>
  );
}
