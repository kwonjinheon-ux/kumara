"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, MouseEvent } from "react";

import {
  hamiltonSuburbs,
  marketBoardTypes,
  marketItemConditions,
  marketItemCategories,
  marketRegions,
  marketTradeMethods,
} from "@/config/marketplace";
import { Button, ButtonLink } from "@/components/common/Button";
import type { MarketBoardType, MarketContactMethod, MarketItemCategory, MarketPostImage, MarketPriceType, PublicMarketPost } from "@/types/marketplace";

type Props = {
  imageLimit: number;
  initialBoardType?: MarketBoardType;
  initialPost?: PublicMarketPost;
  mode?: "create" | "edit";
  userContact: {
    email: string | null;
    kakaoTalkId: string | null;
    smartphoneNumber: string | null;
    allowChat: boolean;
  };
};

const editorColors = [
  "#111827",
  "#2563eb",
  "#0891b2",
  "#0f766e",
  "#16a34a",
  "#ca8a04",
  "#ea580c",
  "#dc2626",
  "#db2777",
  "#7c3aed",
];

export function MarketplacePostForm({ imageLimit, initialBoardType, initialPost, mode = "create", userContact }: Props) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const selectedEditorImageRef = useRef<HTMLImageElement | null>(null);
  const savedEditorRangeRef = useRef<Range | null>(null);
  const isEditMode = mode === "edit" && Boolean(initialPost);
  const boardType = initialPost?.boardType ?? initialBoardType ?? marketBoardTypes[0];
  const isFreeShareBoard = boardType === "무료나눔";
  const [priceType, setPriceType] = useState<MarketPriceType>(
    initialPost?.priceType ?? (isFreeShareBoard ? "free" : "amount"),
  );
  const [itemCategory, setItemCategory] = useState<MarketItemCategory>(
    initialPost?.itemCategory ?? marketItemCategories[0],
  );
  const [selectedRegion, setSelectedRegion] = useState(() =>
    initialPost?.region && hamiltonSuburbs.includes(initialPost.region) ? "Hamilton" : (initialPost?.region ?? marketRegions[0]),
  );
  const [selectedHamiltonSuburb, setSelectedHamiltonSuburb] = useState(() =>
    initialPost?.region && hamiltonSuburbs.includes(initialPost.region) ? initialPost.region : "",
  );
  const [contactMethods, setContactMethods] = useState<MarketContactMethod[]>(() => [
    ...(initialPost?.contactMethods?.length
      ? initialPost.contactMethods
      : [
          userContact.allowChat
            ? "korin_chat"
            : userContact.email
              ? "email"
              : userContact.smartphoneNumber
                ? "phone"
                : "kakao" as MarketContactMethod,
        ]),
  ]);
  const [inlineImages, setInlineImages] = useState<MarketPostImage[]>([]);
  const [images, setImages] = useState<MarketPostImage[]>(initialPost?.images ?? []);
  const [coverImageId, setCoverImageId] = useState<string | null>(initialPost?.coverImageId ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showEditorToolbar, setShowEditorToolbar] = useState(false);
  const [hasSelectedEditorImage, setHasSelectedEditorImage] = useState(false);

  useEffect(() => {
    if (!editorRef.current || !initialPost) return;
    editorRef.current.innerHTML = initialPost.contentHtml || escapeHtml(initialPost.content);
    saveEditorSelection();
  }, [initialPost]);

  async function onInlineImageChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (!files.length) return;

    if (inlineImages.length + images.length + files.length > imageLimit) {
      setMessage(`현재 등급에서는 이미지를 최대 ${imageLimit}장까지 넣을 수 있습니다.`);
      event.target.value = "";
      return;
    }

    try {
      const nextImages = await Promise.all(files.map(readImageFile));
      setInlineImages((current) => [...current, ...nextImages]);
      insertImagesIntoEditor(nextImages);
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "이미지를 불러오지 못했습니다.");
    } finally {
      event.target.value = "";
    }
  }

  async function onGalleryImageChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (!files.length) return;

    if (inlineImages.length + images.length + files.length > imageLimit) {
      setMessage(`현재 등급에서는 이미지를 최대 ${imageLimit}장까지 넣을 수 있습니다.`);
      event.target.value = "";
      return;
    }

    try {
      const nextImages = await Promise.all(files.map(readImageFile));
      const mergedImages = [...images, ...nextImages];
      setImages(mergedImages);
      setCoverImageId((current) => current ?? mergedImages[0]?.id ?? null);
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "이미지를 불러오지 못했습니다.");
    } finally {
      event.target.value = "";
    }
  }

  function insertImagesIntoEditor(nextImages: MarketPostImage[]) {
    const editor = editorRef.current;
    if (!editor) return;

    const html = nextImages
      .map(
        (image) =>
          `<figure class="market-editor-image-frame" contenteditable="false" style="width: 100%; max-width: 720px;"><img src="${image.dataUrl}" alt="${escapeAttribute(image.alt)}" data-market-inline-image="true" style="width: 100%; height: auto;" /></figure><p><br></p>`,
      )
      .join("");

    editor.focus();
    restoreEditorSelection();

    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : document.createRange();
    if (!selection?.rangeCount) {
      range.selectNodeContents(editor);
      range.collapse(false);
    }
    const template = document.createElement("template");
    template.innerHTML = html;
    const fragment = template.content;
    const insertedImages = Array.from(fragment.querySelectorAll("img"));
    const lastNode = fragment.lastChild;

    range.deleteContents();
    range.insertNode(fragment);

    if (lastNode) {
      const nextRange = document.createRange();
      nextRange.setStartAfter(lastNode);
      nextRange.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(nextRange);
      savedEditorRangeRef.current = nextRange.cloneRange();
    }

    selectEditorImage(insertedImages.at(-1) ?? null);
  }

  function saveEditorSelection() {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const selectedInsideEditor = editor.contains(container.nodeType === Node.ELEMENT_NODE ? container : container.parentNode);

    if (selectedInsideEditor) {
      savedEditorRangeRef.current = range.cloneRange();
    }
  }

  function restoreEditorSelection() {
    const selection = window.getSelection();
    const range = savedEditorRangeRef.current;

    if (!selection || !range) return;

    selection.removeAllRanges();
    selection.addRange(range);
  }

  function selectEditorImage(image: HTMLImageElement | null) {
    if (selectedEditorImageRef.current) {
      selectedEditorImageRef.current.removeAttribute("data-selected");
    }

    selectedEditorImageRef.current = image;

    if (image) {
      image.dataset.selected = "true";
    }

    setHasSelectedEditorImage(Boolean(image));
  }

  function onEditorClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;
    selectEditorImage(target instanceof HTMLImageElement ? target : null);
    saveEditorSelection();
  }

  function resizeSelectedEditorImage(width: string) {
    const image = selectedEditorImageRef.current;
    if (!image) return;
    const frame = image.closest<HTMLElement>(".market-editor-image-frame");
    const target = frame ?? image;

    target.style.width = width;
    target.style.maxWidth = width === "100%" ? "100%" : width;
    image.style.height = "auto";
    target.style.marginLeft = width === "100%" ? "0" : "auto";
    target.style.marginRight = width === "100%" ? "0" : "auto";
  }

  function onRegionChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextRegion = event.target.value;
    setSelectedRegion(nextRegion);
    if (nextRegion !== "Hamilton") {
      setSelectedHamiltonSuburb("");
    }
  }

  function applyCommand(command: string, value?: string) {
    editorRef.current?.focus();
    restoreEditorSelection();
    document.execCommand(command, false, value);
    saveEditorSelection();
  }

  function addLink() {
    const url = window.prompt("연결할 주소를 입력하세요.");
    if (!url) return;

    const safeUrl = normalizeEditorUrl(url);
    if (!safeUrl) return;

    insertLinkIntoEditor(safeUrl);
  }

  function insertLinkIntoEditor(url: string) {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    restoreEditorSelection();

    const selection = window.getSelection();
    let range = selection?.rangeCount ? selection.getRangeAt(0) : null;

    if (!selection || !range) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    const selectedText = range.toString().trim();
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noreferrer noopener";
    link.textContent = selectedText || url;

    if (range.collapsed) {
      range.insertNode(link);
    } else {
      const fragment = range.extractContents();
      link.appendChild(fragment);
      range.insertNode(link);
    }

    const nextRange = document.createRange();
    nextRange.setStartAfter(link);
    nextRange.collapse(true);
    const activeSelection = window.getSelection();
    if (activeSelection) {
      activeSelection.removeAllRanges();
      activeSelection.addRange(nextRange);
    }
    savedEditorRangeRef.current = nextRange.cloneRange();
  }

  function preventToolbarFocusLoss(event: MouseEvent<HTMLDivElement>) {
    if (event.target instanceof HTMLButtonElement) {
      event.preventDefault();
    }
  }

  function removeImage(imageId: string) {
    const nextImages = images.filter((image) => image.id !== imageId);
    setImages(nextImages);
    setCoverImageId((current) => {
      if (current && current !== imageId) return current;
      return nextImages[0]?.id ?? null;
    });
  }

  function onTitleChange(event: ChangeEvent<HTMLInputElement>) {
    const suggestedCategory = inferMarketItemCategory(event.target.value);

    if (suggestedCategory) {
      setItemCategory(suggestedCategory);
    }
  }

  function isContactSelected(method: MarketContactMethod) {
    return contactMethods.includes(method);
  }

  function toggleContactMethod(method: MarketContactMethod, checked: boolean) {
    setContactMethods((current) => {
      if (checked) return current.includes(method) ? current : [...current, method];
      const nextMethods = current.filter((item) => item !== method);
      return nextMethods.length ? nextMethods : current;
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setUploadProgress(4);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const editorHtml = editorRef.current?.innerHTML ?? "";
    const editorText = editorRef.current?.textContent?.trim() ?? "";
    const activeInlineImages = inlineImages.filter((image) => editorHtml.includes(image.dataUrl));
    const submittedImages = images;
    const submittedThumbnailDataUrl =
      images[0]?.thumbnailDataUrl ??
      activeInlineImages[0]?.thumbnailDataUrl ??
      getFirstEditorImageDataUrl(editorHtml);
    const submittedCoverImageId = coverImageId ?? images[0]?.id ?? null;

    if (!editorText && !submittedImages.length && !activeInlineImages.length && !getFirstEditorImageDataUrl(editorHtml)) {
      setSubmitting(false);
      setMessage("본문을 입력하거나 이미지를 추가해 주세요.");
      return;
    }

    if (!contactMethods.length) {
      setSubmitting(false);
      setMessage("연락 방식을 하나 이상 선택해 주세요.");
      return;
    }

    setUploadProgress(12);

    const selectedFormRegion = String(form.get("region") ?? "");
    const selectedFormHamiltonSuburb = String(form.get("hamiltonSuburb") ?? "");
    const payload = {
        boardType: form.get("boardType"),
        itemCategory: form.get("itemCategory"),
        title: form.get("title"),
        content: editorText,
        contentHtml: editorHtml,
        priceType: isFreeShareBoard ? "free" : priceType,
        priceAmount: isFreeShareBoard ? "" : form.get("priceAmount"),
        region: selectedFormRegion === "Hamilton" ? selectedFormHamiltonSuburb : selectedFormRegion,
        tradeMethod: form.get("tradeMethod"),
        itemCondition: form.get("itemCondition"),
        contactMethod: contactMethods[0],
        contactMethods,
        contactPhoneNumber: form.get("contactPhoneNumber"),
        contactKakaoTalkId: form.get("contactKakaoTalkId"),
        thumbnailDataUrl: submittedThumbnailDataUrl,
        images: submittedImages,
        coverImageId: submittedCoverImageId,
      };

    const result = await saveMarketplacePost({
      method: isEditMode ? "PATCH" : "POST",
      onProgress: setUploadProgress,
      payload,
      postId: initialPost?.id,
    });
    setUploadProgress(100);

    if (!result.ok || !result.post?.id) {
      setSubmitting(false);
      setUploadProgress(0);
      setMessage(result.error ?? "게시글을 저장하지 못했습니다.");
      return;
    }

    router.push(`/marketplace/${result.post.id}`);
    router.refresh();
  }

  return (
    <form className="market-form" onSubmit={onSubmit}>
      <input name="boardType" type="hidden" value={boardType} />
      <div className="section-title">
        <h2>마켓 글쓰기</h2>
      </div>

      <label>
        제목
        <input
          maxLength={80}
          name="title"
          defaultValue={initialPost?.title ?? ""}
          onChange={onTitleChange}
          placeholder="예: 아이폰 13 판매합니다"
          required
        />
        <span className="market-form-hint">제목에 따라 물품 종류가 자동으로 분류됩니다.</span>
      </label>

      <div className="market-form-grid">
        <label>
          물품 종류
          <select
            name="itemCategory"
            onChange={(event) => setItemCategory(event.target.value as MarketItemCategory)}
            required
            value={itemCategory}
          >
            {marketItemCategories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label>
          거래방식
          <select name="tradeMethod" required defaultValue={initialPost?.tradeMethod}>
            {marketTradeMethods.map((method) => (
              <option key={method}>{method}</option>
            ))}
          </select>
        </label>
        <label>
          물품상태
          <select name="itemCondition" required defaultValue={initialPost?.itemCondition}>
            {marketItemConditions.map((condition) => (
              <option key={condition}>{condition}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="market-editor-field">
        <div className="market-editor-heading">
          <span>본문</span>
          <button
            aria-expanded={showEditorToolbar}
            className="market-editor-toggle"
            onClick={() => setShowEditorToolbar((current) => !current)}
            type="button"
          >
            {showEditorToolbar ? "HTML 편집툴 닫기" : "HTML 편집툴 보기"}
          </button>
        </div>
        {showEditorToolbar ? (
          <div
            className="market-editor-toolbar"
            aria-label="본문 편집 도구"
            onMouseDownCapture={preventToolbarFocusLoss}
          >
            <button onClick={() => applyCommand("formatBlock", "p")} type="button">본문</button>
            <button onClick={() => applyCommand("formatBlock", "h2")} type="button">H2</button>
            <button onClick={() => applyCommand("formatBlock", "h3")} type="button">H3</button>
            <button onClick={() => applyCommand("bold")} type="button">B</button>
            <button onClick={() => applyCommand("italic")} type="button">I</button>
            <button onClick={() => applyCommand("underline")} type="button">U</button>
            <button onClick={() => applyCommand("strikeThrough")} type="button">S</button>
            <button onClick={() => applyCommand("formatBlock", "blockquote")} type="button">인용</button>
            <button onClick={() => applyCommand("insertUnorderedList")} type="button">• 목록</button>
            <button onClick={() => applyCommand("insertOrderedList")} type="button">1. 목록</button>
            <button onClick={() => applyCommand("justifyLeft")} type="button">좌</button>
            <button onClick={() => applyCommand("justifyCenter")} type="button">중</button>
            <button onClick={addLink} type="button">링크</button>
            <button onClick={() => applyCommand("unlink")} type="button">해제</button>
            <button onClick={() => applyCommand("insertHorizontalRule")} type="button">구분선</button>
            <button onClick={() => applyCommand("removeFormat")} type="button">서식삭제</button>
            <div className="market-color-palette" aria-label="글자 색상">
              {editorColors.map((color) => (
                <button
                  aria-label={`글자 색상 ${color}`}
                  className="market-color-button"
                  key={color}
                  onClick={() => applyCommand("foreColor", color)}
                  style={{ backgroundColor: color }}
                  type="button"
                />
              ))}
            </div>
            {hasSelectedEditorImage ? (
              <div className="market-image-size-tools" aria-label="선택 이미지 크기">
                <button onClick={() => resizeSelectedEditorImage("38%")} type="button">작게</button>
                <button onClick={() => resizeSelectedEditorImage("64%")} type="button">보통</button>
                <button onClick={() => resizeSelectedEditorImage("82%")} type="button">크게</button>
                <button onClick={() => resizeSelectedEditorImage("100%")} type="button">전체</button>
              </div>
            ) : null}
            <label className="market-editor-image-button">
              이미지 넣기
              <input accept="image/*" multiple onChange={onInlineImageChange} type="file" />
            </label>
          </div>
        ) : null}
        <div
          aria-label="본문 편집기"
          className="market-rich-editor"
          contentEditable
          data-placeholder="상태, 구성품, 거래 가능 시간 등을 적어주세요."
          onClick={onEditorClick}
          onInput={saveEditorSelection}
          onKeyUp={saveEditorSelection}
          onMouseUp={saveEditorSelection}
          ref={editorRef}
          role="textbox"
          suppressContentEditableWarning
        />
      </div>

      <div className="market-image-manager">
        <div className="keyword-tags-title">
          <strong>이미지 첨부</strong>
          <span>대표 이미지 선택 가능</span>
        </div>
        <label className="market-gallery-upload-button">
          이미지 선택
          <input accept="image/*" multiple onChange={onGalleryImageChange} type="file" />
        </label>
        {images.length ? (
          <div className="market-image-grid">
            {images.map((image, index) => (
              <div className="market-image-option" key={image.id}>
                <button
                  aria-label={`${index + 1}번 이미지를 대표 이미지로 선택`}
                  aria-pressed={coverImageId === image.id}
                  className="market-image-cover-button"
                  onClick={() => setCoverImageId(image.id)}
                  type="button"
                >
                  {coverImageId === image.id ? <span className="market-cover-badge">대표</span> : null}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt={image.alt} src={image.dataUrl} />
                </button>
                <span className="market-image-number">{index + 1}번</span>
                <button
                  aria-label={`${index + 1}번 이미지 삭제`}
                  className="market-image-delete-button"
                  onClick={() => removeImage(image.id)}
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="market-image-empty">첨부 이미지를 올리면 대표 이미지와 상세 갤러리로 사용됩니다.</p>
        )}
        </div>

      <section className="market-trade-condition-field" aria-label="거래 조건">
        <div className="keyword-tags-title">
          <strong>거래 조건</strong>
          <span>
            {isFreeShareBoard ? "무료나눔은 금액 입력 없이 거래 지역만 설정합니다." : "가격 방식, NZD 금액, 거래 지역을 한 번에 설정합니다."}
          </span>
        </div>
        <div className="market-form-grid market-form-grid--trade">
          {isFreeShareBoard ? null : (
            <>
              <label>
                가격 방식
                <select
                  onChange={(event) => setPriceType(event.target.value as MarketPriceType)}
                  value={priceType}
                >
                  <option value="amount">금액 입력</option>
                  <option value="free">무료나눔</option>
                  <option value="offer">가격제안</option>
                </select>
              </label>
              <label>
                가격 NZD
                <input
                  disabled={priceType !== "amount"}
                  min="0"
                  name="priceAmount"
                  placeholder="예: 120"
                  required={priceType === "amount"}
                  step="0.01"
                  type="number"
                  defaultValue={initialPost?.priceAmount ?? ""}
                />
              </label>
            </>
          )}
          <label>
            거래 지역
            <select name="region" required value={selectedRegion} onChange={onRegionChange}>
              {marketRegions.map((region) => (
                <option key={region}>{region}</option>
              ))}
            </select>
          </label>
          {selectedRegion === "Hamilton" ? (
            <label>
              상세 지역
              <select
                name="hamiltonSuburb"
                required
                value={selectedHamiltonSuburb}
                onChange={(event) => setSelectedHamiltonSuburb(event.target.value)}
              >
                <option value="">상세 지역 선택</option>
                {hamiltonSuburbs.map((suburb) => (
                  <option key={suburb}>{suburb}</option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </section>

      <section className="market-contact-field" aria-label="연락 방식">
        <div className="keyword-tags-title">
          <strong>연락 방식</strong>
          <span>상세 본문 아래에 표시됩니다.</span>
        </div>
        <div className="market-contact-options">
          <label className={isContactSelected("korin_chat") ? "active" : ""}>
            <input
              checked={isContactSelected("korin_chat")}
              name="contactMethods"
              onChange={(event) => toggleContactMethod("korin_chat", event.target.checked)}
              type="checkbox"
              value="korin_chat"
            />
            <span>
              <strong>KumaraMarket.nz 1:1 채팅</strong>
              <small>KumaraMarket.nz 사이트를 통해 1:1 연락채팅 가능</small>
            </span>
          </label>
          <label className={isContactSelected("email") ? "active" : ""}>
            <input
              checked={isContactSelected("email")}
              disabled={!userContact.email}
              name="contactMethods"
              onChange={(event) => toggleContactMethod("email", event.target.checked)}
              type="checkbox"
              value="email"
            />
            <span>
              <strong>이메일</strong>
              <small>{userContact.email ?? "계정 이메일 정보가 없습니다."}</small>
            </span>
          </label>
          <label className={isContactSelected("kakao") ? "active" : ""}>
            <input
              checked={isContactSelected("kakao")}
              name="contactMethods"
              onChange={(event) => toggleContactMethod("kakao", event.target.checked)}
              type="checkbox"
              value="kakao"
            />
            <span>
              <strong>카카오톡</strong>
              <small>{userContact.kakaoTalkId ?? "글 등록 시 아래에 카카오톡 ID를 입력해 주세요."}</small>
            </span>
          </label>
          <label className={isContactSelected("phone") ? "active" : ""}>
            <input
              checked={isContactSelected("phone")}
              name="contactMethods"
              onChange={(event) => toggleContactMethod("phone", event.target.checked)}
              type="checkbox"
              value="phone"
            />
            <span>
              <strong>전화번호</strong>
              <small>{userContact.smartphoneNumber ?? "기본 정보에 전화번호가 없으면 아래에 입력해 주세요."}</small>
            </span>
          </label>
        </div>
        {isContactSelected("phone") && !userContact.smartphoneNumber ? (
          <label>
            연락 받을 전화번호
            <input
              name="contactPhoneNumber"
              placeholder="예: 021 123 4567"
              required
              type="tel"
              defaultValue={initialPost?.contactValues?.phone ?? ""}
            />
          </label>
        ) : null}
        {isContactSelected("kakao") && !userContact.kakaoTalkId ? (
          <label>
            카카오톡 ID
            <input
              maxLength={40}
              name="contactKakaoTalkId"
              placeholder="카카오톡 ID를 입력해 주세요."
              required
              defaultValue={initialPost?.contactValues?.kakao ?? ""}
            />
          </label>
        ) : null}
      </section>

      {message ? <p className="form-error">{message}</p> : null}

      {submitting ? (
        <div className="market-submit-progress-overlay" role="status" aria-live="polite" aria-modal="true">
          <div className="market-submit-progress">
            <div>
              <strong>글을 등록중입니다</strong>
              <span>{uploadProgress}%</span>
            </div>
            <progress max="100" value={uploadProgress} />
            <p>이미지와 내용을 서버에 안전하게 저장하고 있습니다.</p>
          </div>
        </div>
      ) : null}

      <div className="market-form-actions">
        <Button className="market-submit-button" type="submit" disabled={submitting}>
          {submitting ? `등록 중 ${uploadProgress}%` : "등록하기"}
        </Button>
        <ButtonLink href={initialPost ? `/marketplace/${initialPost.id}` : "/marketplace"} variant="muted">
          취소
        </ButtonLink>
      </div>
    </form>
  );
}

function readImageFile(file: File): Promise<MarketPostImage> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("이미지 파일만 업로드할 수 있습니다."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
    reader.onload = async () => {
      if (typeof reader.result !== "string") {
        reject(new Error("이미지를 불러오지 못했습니다."));
        return;
      }

      const optimizedDataUrl = await createImageDataUrl(reader.result, 1280, 0.78);
      const thumbnailDataUrl = await createImageDataUrl(optimizedDataUrl, 420, 0.68);

      resolve({
        id: crypto.randomUUID(),
        dataUrl: optimizedDataUrl,
        alt: file.name.replace(/\.[^.]+$/, "").slice(0, 80) || "본문 이미지",
        thumbnailDataUrl,
        createdAt: new Date().toISOString(),
      });
    };
    reader.readAsDataURL(file);
  });
}

function saveMarketplacePost({
  method,
  onProgress,
  payload,
  postId,
}: {
  method: "PATCH" | "POST";
  onProgress: (progress: number) => void;
  payload: Record<string, unknown>;
  postId?: string;
}): Promise<{ ok: boolean; error?: string; post?: { id: string } }> {
  return new Promise((resolve) => {
    const request = new XMLHttpRequest();

    request.open(method, postId ? `/api/marketplace/posts/${postId}` : "/api/marketplace/posts");
    request.setRequestHeader("Content-Type", "application/json");
    request.withCredentials = true;

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        onProgress(72);
        return;
      }

      const uploadPercent = Math.round((event.loaded / event.total) * 76);
      onProgress(Math.min(88, 12 + uploadPercent));
    };

    request.onerror = () => {
      resolve({ ok: false, error: "네트워크 오류로 게시글을 저장하지 못했습니다." });
    };

    request.onload = () => {
      onProgress(96);

      try {
        const response = JSON.parse(request.responseText || "{}") as { error?: string; post?: { id: string } };
        resolve({
          ok: request.status >= 200 && request.status < 300,
          error: response.error,
          post: response.post,
        });
      } catch {
        resolve({ ok: false, error: "게시글 저장 응답을 확인하지 못했습니다." });
      }
    };

    request.send(JSON.stringify(payload));
  });
}

function getFirstEditorImageDataUrl(contentHtml: string) {
  const match = contentHtml.match(/<img\b[^>]*\bsrc=(["'])(.*?)\1/i);
  const imageUrl = match?.[2]?.trim();

  return imageUrl?.startsWith("data:image/") ? imageUrl : null;
}

function createImageDataUrl(dataUrl: string, maxSize: number, quality: number): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();

    image.onerror = () => resolve(dataUrl);
    image.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        resolve(dataUrl);
        return;
      }

      canvas.width = width;
      canvas.height = height;
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    image.src = dataUrl;
  });
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const categoryKeywordRules: Array<{ category: MarketItemCategory; keywords: string[] }> = [
  {
    category: "전자기기",
    keywords: [
      "iphone",
      "ipad",
      "galaxy",
      "samsung",
      "macbook",
      "laptop",
      "notebook",
      "computer",
      "pc",
      "monitor",
      "keyboard",
      "mouse",
      "printer",
      "camera",
      "canon",
      "nikon",
      "sony",
      "tv",
      "television",
      "speaker",
      "headphone",
      "earphone",
      "airpods",
      "tablet",
      "phone",
      "mobile",
      "console",
      "playstation",
      "ps5",
      "xbox",
      "nintendo",
      "switch",
      "아이폰",
      "아이패드",
      "갤럭시",
      "맥북",
      "노트북",
      "컴퓨터",
      "모니터",
      "키보드",
      "마우스",
      "프린터",
      "카메라",
      "텔레비전",
      "티비",
      "스피커",
      "헤드폰",
      "이어폰",
      "에어팟",
      "태블릿",
      "휴대폰",
      "핸드폰",
      "플스",
      "닌텐도",
    ],
  },
  {
    category: "가전제품",
    keywords: [
      "fridge",
      "freezer",
      "washer",
      "washing machine",
      "dryer",
      "dishwasher",
      "microwave",
      "oven",
      "vacuum",
      "heater",
      "air conditioner",
      "dehumidifier",
      "coffee machine",
      "rice cooker",
      "appliance",
      "냉장고",
      "냉동고",
      "세탁기",
      "건조기",
      "식기세척기",
      "전자레인지",
      "오븐",
      "청소기",
      "히터",
      "에어컨",
      "제습기",
      "커피머신",
      "밥솥",
    ],
  },
  {
    category: "가구 / 인테리어",
    keywords: [
      "sofa",
      "couch",
      "table",
      "desk",
      "chair",
      "bed",
      "mattress",
      "drawer",
      "cabinet",
      "wardrobe",
      "shelf",
      "lamp",
      "rug",
      "curtain",
      "mirror",
      "furniture",
      "소파",
      "쇼파",
      "테이블",
      "책상",
      "의자",
      "침대",
      "매트리스",
      "서랍",
      "수납장",
      "옷장",
      "선반",
      "조명",
      "러그",
      "커튼",
      "거울",
      "가구",
    ],
  },
  {
    category: "생활용품",
    keywords: [
      "cleaning",
      "bin",
      "storage",
      "hanger",
      "laundry",
      "bedding",
      "towel",
      "blanket",
      "luggage",
      "bag",
      "suitcase",
      "생활용품",
      "청소",
      "쓰레기통",
      "수납",
      "행거",
      "빨래",
      "침구",
      "이불",
      "수건",
      "담요",
      "캐리어",
      "가방",
    ],
  },
  {
    category: "주방용품",
    keywords: [
      "kitchen",
      "pan",
      "pot",
      "knife",
      "plate",
      "bowl",
      "cup",
      "mug",
      "cutlery",
      "cookware",
      "air fryer",
      "blender",
      "toaster",
      "주방",
      "냄비",
      "프라이팬",
      "후라이팬",
      "칼",
      "접시",
      "그릇",
      "컵",
      "머그",
      "수저",
      "조리도구",
      "에어프라이어",
      "믹서기",
      "토스터",
    ],
  },
  {
    category: "유아 / 아동용품",
    keywords: [
      "baby",
      "kids",
      "child",
      "children",
      "stroller",
      "pram",
      "car seat",
      "cot",
      "bassinet",
      "nappy",
      "toy",
      "lego",
      "유아",
      "아동",
      "아기",
      "아이",
      "어린이",
      "유모차",
      "카시트",
      "아기침대",
      "기저귀",
      "장난감",
      "레고",
    ],
  },
  {
    category: "의류 / 패션",
    keywords: [
      "clothing",
      "fashion",
      "shirt",
      "pants",
      "jeans",
      "dress",
      "jacket",
      "coat",
      "shoes",
      "sneakers",
      "watch",
      "jewellery",
      "jewelry",
      "bag",
      "handbag",
      "wallet",
      "purse",
      "belt",
      "scarf",
      "louis vuitton",
      "lv",
      "chanel",
      "gucci",
      "dior",
      "christian dior",
      "prada",
      "hermes",
      "hermès",
      "burberry",
      "balenciaga",
      "versace",
      "armani",
      "dolce",
      "dolce gabbana",
      "dolce & gabbana",
      "givenchy",
      "celine",
      "chloe",
      "chloé",
      "fendi",
      "miu miu",
      "miumiu",
      "ysl",
      "saint laurent",
      "yves saint laurent",
      "valentino",
      "alexander mcqueen",
      "balmain",
      "vivienne westwood",
      "loewe",
      "bottega",
      "bottega veneta",
      "moncler",
      "canada goose",
      "stone island",
      "supreme",
      "off-white",
      "off white",
      "nike",
      "adidas",
      "new balance",
      "converse",
      "vans",
      "zara",
      "uniqlo",
      "h&m",
      "cos",
      "mango",
      "옷",
      "의류",
      "패션",
      "셔츠",
      "바지",
      "청바지",
      "원피스",
      "자켓",
      "재킷",
      "코트",
      "신발",
      "운동화",
      "시계",
      "주얼리",
      "쥬얼리",
      "가방",
      "핸드백",
      "지갑",
      "벨트",
      "스카프",
      "루이비통",
      "루이 비통",
      "엘브이",
      "샤넬",
      "구찌",
      "디올",
      "프라다",
      "에르메스",
      "버버리",
      "발렌시아가",
      "베르사체",
      "아르마니",
      "돌체",
      "돌체앤가바나",
      "돌체 앤 가바나",
      "지방시",
      "셀린",
      "셀린느",
      "끌로에",
      "클로에",
      "펜디",
      "미우미우",
      "생로랑",
      "입생로랑",
      "발렌티노",
      "알렉산더맥퀸",
      "알렉산더 맥퀸",
      "발망",
      "비비안웨스트우드",
      "비비안 웨스트우드",
      "로에베",
      "보테가",
      "보테가베네타",
      "보테가 베네타",
      "몽클레어",
      "몽클레르",
      "캐나다구스",
      "스톤아일랜드",
      "스톤 아일랜드",
      "슈프림",
      "오프화이트",
      "나이키",
      "아디다스",
      "뉴발란스",
      "컨버스",
      "반스",
      "자라",
      "유니클로",
      ],
  },
  {
    category: "뷰티 / 건강",
    keywords: [
      "beauty",
      "health",
      "makeup",
      "cosmetic",
      "skincare",
      "fragrance",
      "perfume",
      "hair dryer",
      "straightener",
      "massage",
      "medical",
      "supplement",
      "뷰티",
      "건강",
      "화장품",
      "스킨케어",
      "향수",
      "드라이기",
      "고데기",
      "마사지",
      "의료",
      "영양제",
    ],
  },
  {
    category: "취미 / 스포츠",
    keywords: [
      "sports",
      "camping",
      "bike",
      "bicycle",
      "cycling",
      "golf",
      "fishing",
      "surf",
      "ski",
      "fitness",
      "gym",
      "instrument",
      "guitar",
      "piano",
      "vinyl",
      "craft",
      "취미",
      "스포츠",
      "캠핑",
      "자전거",
      "골프",
      "낚시",
      "서핑",
      "스키",
      "운동",
      "헬스",
      "악기",
      "기타",
      "피아노",
      "LP",
      "공예",
    ],
  },
  {
    category: "책 / 문구",
    keywords: [
      "book",
      "books",
      "comic",
      "magazine",
      "textbook",
      "stationery",
      "pen",
      "notebook",
      "책",
      "도서",
      "만화",
      "잡지",
      "교재",
      "문구",
      "펜",
      "공책",
    ],
  },
  {
    category: "자동차용품",
    keywords: [
      "car",
      "vehicle",
      "motor",
      "tyre",
      "tire",
      "wheel",
      "roof rack",
      "car stereo",
      "dash cam",
      "자동차",
      "차량",
      "타이어",
      "휠",
      "루프랙",
      "블랙박스",
      "차량용",
    ],
  },
  {
    category: "반려동물용품",
    keywords: [
      "pet",
      "dog",
      "cat",
      "bird",
      "fish",
      "rabbit",
      "reptile",
      "aquarium",
      "kennel",
      "반려동물",
      "강아지",
      "개",
      "고양이",
      "새",
      "물고기",
      "토끼",
      "파충류",
      "어항",
      "켄넬",
    ],
  },
  {
    category: "티켓 / 상품권",
    keywords: [
      "ticket",
      "voucher",
      "gift card",
      "event",
      "concert",
      "festival",
      "flight",
      "accommodation",
      "티켓",
      "입장권",
      "상품권",
      "기프트카드",
      "공연",
      "콘서트",
      "페스티벌",
      "항공권",
      "숙박권",
    ],
  },
];

const categoryBrandAndItemRules: Array<{ category: MarketItemCategory; keywords: string[] }> = [
  {
    category: "가전제품",
    keywords: [
      "fisher paykel",
      "fisher & paykel",
      "fisher and paykel",
      "samsung",
      "lg",
      "bosch",
      "miele",
      "dyson",
      "breville",
      "kitchenaid",
      "smeg",
      "panasonic",
      "philips",
      "delonghi",
      "delonghi",
      "haier",
      "westinghouse",
      "electrolux",
      "whirlpool",
      "bissell",
      "fridge",
      "washing machine",
      "dishwasher",
      "dryer",
      "microwave",
      "air fryer",
      "coffee machine",
      "vacuum cleaner",
      "피셔앤파이켈",
      "피셔 페이켈",
      "삼성 냉장고",
      "엘지 냉장고",
      "LG 냉장고",
      "다이슨 청소기",
      "밀레",
      "보쉬",
      "브레빌",
      "키친에이드",
      "스메그",
      "파나소닉",
      "필립스",
      "드롱기",
      "하이얼",
      "웨스팅하우스",
      "일렉트로룩스",
      "월풀",
      "비셀",
      "냉장고",
      "세탁기",
      "식기세척기",
      "건조기",
      "전자레인지",
      "에어프라이어",
      "커피머신",
      "청소기",
    ],
  },
  {
    category: "가구 / 인테리어",
    keywords: [
      "ikea",
      "freedom",
      "mocka",
      "harvey norman",
      "farmers",
      "briscoes",
      "kmart",
      "target",
      "fantastic furniture",
      "amart",
      "koala",
      "ecosa",
      "tempur",
      "sealy",
      "sleepyhead",
      "lazy boy",
      "la-z-boy",
      "sofa",
      "dining table",
      "coffee table",
      "office chair",
      "bookshelf",
      "bed frame",
      "mattress",
      "이케아",
      "아이키아",
      "프리덤",
      "모카",
      "하비노먼",
      "파머스",
      "브리스코스",
      "케이마트",
      "판타스틱 퍼니처",
      "아마트",
      "코알라 매트리스",
      "에코사",
      "템퍼",
      "씰리",
      "슬리피헤드",
      "리클라이너",
      "소파",
      "식탁",
      "커피테이블",
      "사무용 의자",
      "책장",
      "침대프레임",
      "매트리스",
    ],
  },
  {
    category: "생활용품",
    keywords: [
      "brita",
      "sistema",
      "rubbermaid",
      "tupperware",
      "oxo",
      "decor",
      "locknlock",
      "lock & lock",
      "samsonite",
      "american tourister",
      "mujirushi",
      "muji",
      "storage box",
      "laundry basket",
      "clothes rack",
      "suitcase",
      "water filter",
      "브리타",
      "시스테마",
      "러버메이드",
      "타파웨어",
      "옥소",
      "락앤락",
      "샘소나이트",
      "아메리칸 투어리스터",
      "무인양품",
      "무지",
      "수납박스",
      "빨래바구니",
      "빨래건조대",
      "행거",
      "캐리어",
      "정수기",
      "정수필터",
    ],
  },
  {
    category: "주방용품",
    keywords: [
      "le creuset",
      "staub",
      "tefal",
      "scanpan",
      "wiltshire",
      "pyrex",
      "corelle",
      "corningware",
      "wmf",
      "zwilling",
      "global knife",
      "victorinox",
      "ninja",
      "nutribullet",
      "vitamix",
      "sodastream",
      "cast iron",
      "cookware set",
      "르크루제",
      "르 쿠르제",
      "스타우브",
      "테팔",
      "스캔팬",
      "윌트셔",
      "파이렉스",
      "코렐",
      "코닝웨어",
      "더블유엠에프",
      "즈윌링",
      "글로벌 나이프",
      "빅토리녹스",
      "닌자 블렌더",
      "뉴트리불렛",
      "바이타믹스",
      "소다스트림",
      "무쇠냄비",
      "주물냄비",
      "조리도구 세트",
    ],
  },
  {
    category: "유아 / 아동용품",
    keywords: [
      "bugaboo",
      "uppababy",
      "babyzen",
      "yoyo",
      "mountain buggy",
      "phil&teds",
      "phil and teds",
      "maxi cosi",
      "britax",
      "graco",
      "chicco",
      "baby bjorn",
      "ergobaby",
      "stokke",
      "cybex",
      "medela",
      "avent",
      "tommee tippee",
      "huggies",
      "pampers",
      "pram",
      "stroller",
      "car seat",
      "baby monitor",
      "breast pump",
      "부가부",
      "어파베이비",
      "베이비젠",
      "요요 유모차",
      "마운틴버기",
      "필앤테즈",
      "맥시코시",
      "브라이택스",
      "그라코",
      "치코",
      "베이비뵨",
      "에르고베이비",
      "스토케",
      "싸이벡스",
      "사이벡스",
      "메델라",
      "아벤트",
      "토미티피",
      "하기스",
      "팸퍼스",
      "유모차",
      "카시트",
      "아기 모니터",
      "유축기",
    ],
  },
  {
    category: "의류 / 패션",
    keywords: [
      "louis vuitton",
      "lv",
      "chanel",
      "gucci",
      "dior",
      "prada",
      "hermes",
      "hermès",
      "burberry",
      "balenciaga",
      "versace",
      "armani",
      "givenchy",
      "celine",
      "fendi",
      "miu miu",
      "ysl",
      "saint laurent",
      "valentino",
      "loewe",
      "bottega veneta",
      "moncler",
      "stone island",
      "supreme",
      "off-white",
      "nike",
      "adidas",
      "new balance",
      "converse",
      "vans",
      "zara",
      "uniqlo",
      "handbag",
      "wallet",
      "sneakers",
      "dress",
      "coat",
      "jacket",
      "watch",
      "루이비통",
      "샤넬",
      "구찌",
      "디올",
      "프라다",
      "에르메스",
      "버버리",
      "발렌시아가",
      "베르사체",
      "아르마니",
      "지방시",
      "셀린느",
      "펜디",
      "미우미우",
      "생로랑",
      "입생로랑",
      "발렌티노",
      "로에베",
      "보테가베네타",
      "몽클레어",
      "스톤아일랜드",
      "슈프림",
      "오프화이트",
      "나이키",
      "아디다스",
      "뉴발란스",
      "컨버스",
      "반스",
      "자라",
      "유니클로",
      "핸드백",
      "지갑",
      "운동화",
      "원피스",
      "코트",
      "자켓",
      "시계",
    ],
  },
  {
    category: "뷰티 / 건강",
    keywords: [
      "dyson airwrap",
      "ghd",
      "cloud nine",
      "oral b",
      "oral-b",
      "philips sonicare",
      "foreo",
      "clarins",
      "clinique",
      "estee lauder",
      "estée lauder",
      "lancome",
      "lancôme",
      "kiehl's",
      "la roche posay",
      "cerave",
      "the ordinary",
      "olaplex",
      "kerastase",
      "kerastase",
      "sk-ii",
      "shiseido",
      "sulwhasoo",
      "laneige",
      "innisfree",
      "fitbit",
      "omron",
      "다이슨 에어랩",
      "지에이치디",
      "클라우드나인",
      "오랄비",
      "소닉케어",
      "포레오",
      "클라랑스",
      "크리니크",
      "에스티로더",
      "랑콤",
      "키엘",
      "라로슈포제",
      "세라비",
      "디오디너리",
      "올라플렉스",
      "케라스타즈",
      "SK2",
      "시세이도",
      "설화수",
      "라네즈",
      "이니스프리",
      "핏빗",
      "오므론",
      "혈압계",
      "전동칫솔",
    ],
  },
  {
    category: "취미 / 스포츠",
    keywords: [
      "callaway",
      "taylormade",
      "titleist",
      "ping",
      "wilson",
      "yonex",
      "head racket",
      "babolat",
      "shimano",
      "giant",
      "trek",
      "specialized",
      "merida",
      "scott",
      "garmin",
      "fitbit",
      "coleman",
      "weber",
      "yeti",
      "salomon",
      "burton",
      "k2",
      "yamaha",
      "fender",
      "gibson",
      "roland",
      "casio keyboard",
      "golf club",
      "tennis racket",
      "road bike",
      "mountain bike",
      "fishing rod",
      "tent",
      "sleeping bag",
      "캘러웨이",
      "테일러메이드",
      "타이틀리스트",
      "핑 골프",
      "윌슨 라켓",
      "요넥스",
      "헤드 라켓",
      "바볼랏",
      "시마노",
      "자이언트 자전거",
      "트렉 자전거",
      "스페셜라이즈드",
      "메리다",
      "스캇 자전거",
      "가민",
      "콜맨",
      "웨버",
      "예티",
      "살로몬",
      "버튼 보드",
      "야마하 악기",
      "펜더",
      "깁슨",
      "롤랜드",
      "카시오 키보드",
      "골프채",
      "테니스 라켓",
      "로드자전거",
      "산악자전거",
      "낚싯대",
      "텐트",
      "침낭",
    ],
  },
  {
    category: "전자기기",
    keywords: [
      "apple",
      "iphone",
      "ipad",
      "macbook",
      "imac",
      "samsung galaxy",
      "google pixel",
      "sony",
      "lg monitor",
      "panasonic camera",
      "canon",
      "nikon",
      "fujifilm",
      "gopro",
      "dji",
      "bose",
      "jbl",
      "sonos",
      "anker",
      "logitech",
      "razer",
      "steelseries",
      "asus",
      "acer",
      "lenovo",
      "dell",
      "hp",
      "microsoft surface",
      "playstation",
      "ps5",
      "xbox",
      "nintendo switch",
      "kindle",
      "airpods",
      "애플",
      "아이폰",
      "아이패드",
      "맥북",
      "아이맥",
      "갤럭시",
      "구글 픽셀",
      "소니",
      "LG 모니터",
      "파나소닉 카메라",
      "캐논",
      "니콘",
      "후지필름",
      "고프로",
      "디제이아이",
      "DJI",
      "보스 스피커",
      "제이비엘",
      "소노스",
      "앤커",
      "로지텍",
      "레이저 키보드",
      "스틸시리즈",
      "에이수스",
      "아수스",
      "에이서",
      "레노버",
      "델 노트북",
      "HP 노트북",
      "서피스",
      "플레이스테이션",
      "플스5",
      "엑스박스",
      "닌텐도 스위치",
      "킨들",
      "에어팟",
    ],
  },
  {
    category: "책 / 문구",
    keywords: [
      "penguin",
      "oxford",
      "cambridge",
      "pearson",
      "scholastic",
      "harry potter",
      "moleskine",
      "pilot pen",
      "muji pen",
      "staedtler",
      "faber castell",
      "textbook",
      "novel",
      "comic book",
      "study guide",
      "펭귄북스",
      "옥스포드",
      "캠브리지",
      "피어슨",
      "스콜라스틱",
      "해리포터",
      "몰스킨",
      "파일럿 펜",
      "무지 펜",
      "스테들러",
      "파버카스텔",
      "교과서",
      "문제집",
      "소설책",
      "만화책",
      "참고서",
    ],
  },
  {
    category: "자동차용품",
    keywords: [
      "toyota",
      "mazda",
      "honda",
      "nissan",
      "subaru",
      "ford",
      "holden",
      "bmw",
      "mercedes",
      "audi",
      "tesla",
      "thule",
      "yakima",
      "michelin",
      "bridgestone",
      "pirelli",
      "goodyear",
      "garmin dash cam",
      "navman",
      "carplay",
      "roof rack",
      "tow bar",
      "car mat",
      "토요타",
      "마쯔다",
      "마쓰다",
      "혼다",
      "닛산",
      "스바루",
      "포드",
      "홀덴",
      "비엠더블유",
      "벤츠",
      "아우디",
      "테슬라",
      "툴레",
      "야키마",
      "미쉐린",
      "브리지스톤",
      "피렐리",
      "굿이어",
      "차량용 가민",
      "내브맨",
      "카플레이",
      "루프랙",
      "토우바",
      "차매트",
    ],
  },
  {
    category: "반려동물용품",
    keywords: [
      "royal canin",
      "purina",
      "hill's",
      "hills science diet",
      "eukanuba",
      "kong",
      "frontline",
      "advantage",
      "whiskas",
      "pedigree",
      "cat tree",
      "dog crate",
      "pet carrier",
      "aquarium",
      "fish tank",
      "로얄캐닌",
      "퓨리나",
      "힐스",
      "사이언스다이어트",
      "유카누바",
      "콩 장난감",
      "프론트라인",
      "어드밴티지",
      "위스카스",
      "페디그리",
      "캣타워",
      "강아지 케이지",
      "이동장",
      "어항",
      "수조",
    ],
  },
  {
    category: "티켓 / 상품권",
    keywords: [
      "eventfinda",
      "ticketmaster",
      "ticketek",
      "air new zealand",
      "jetstar",
      "movie ticket",
      "cinema ticket",
      "gift card",
      "voucher",
      "concert ticket",
      "festival ticket",
      "에어뉴질랜드",
      "젯스타",
      "티켓마스터",
      "티켓텍",
      "영화표",
      "영화 티켓",
      "기프트카드",
      "상품권",
      "바우처",
      "콘서트 티켓",
      "페스티벌 티켓",
    ],
  },
];

function inferMarketItemCategory(title: string): MarketItemCategory | null {
  const normalizedTitle = title.toLowerCase();
  if (!normalizedTitle.trim()) return null;

  const rules = [...categoryBrandAndItemRules, ...categoryKeywordRules];
  const rankedRules = rules
    .map((rule, index) => ({
      category: rule.category,
      index,
      score: rule.keywords.reduce(
        (score, keyword) => score + (normalizedTitle.includes(keyword.toLowerCase()) ? 1 : 0),
        0,
      ),
    }))
    .filter((rule) => rule.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  return rankedRules[0]?.category ?? null;
}

function normalizeEditorUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}
