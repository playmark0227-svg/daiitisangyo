"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createListing } from "@/actions/seller";
import { TEMP_ZONES, photoForCategory } from "@/lib/catalog";
import { yen } from "@/lib/format";
import { salePrice } from "@/lib/pricing";
import { TEMP_LABEL, type Category, type TempZone } from "@/lib/types";
import Icon from "@/components/Icon";

function Steps({ current }: { current: number }) {
  return (
    <div className="steps">
      {[1, 2, 3].map((i) => (
        <div key={i} className={i <= current ? "st done" : "st"} />
      ))}
    </div>
  );
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 21, fontWeight: 800, margin: "2px 0 14px", letterSpacing: "-0.01em" }}>
      {children}
    </h2>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-warm btn-xl btn-block" type="submit" disabled={pending}>
      {pending ? "出品しています…" : "売りに出す"}
    </button>
  );
}

/** リアルタイム出品ウィザード（写真・金額・売りに出す の3ステップ） */
export default function NewListingWizard({
  marginRate,
  categories,
}: {
  marginRate: number;
  categories: Category[];
}) {
  const defaultCat = categories.find((c) => c.name === "鮮魚") ?? categories[0];

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [preview, setPreview] = useState(""); // 端末で選んだ写真のプレビュー
  const [photo, setPhoto] = useState(""); // アップロード済みパス
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [cost, setCost] = useState("");
  const [qty, setQty] = useState(1);
  const [temp, setTemp] = useState<TempZone>("chilled");
  const [categoryId, setCategoryId] = useState<number>(defaultCat?.id ?? 1);
  const [title, setTitle] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const costNum = Math.floor(Number(cost));
  const validCost = Number.isFinite(costNum) && costNum > 0;
  const sale = validCost ? salePrice(costNum, marginRate) : 0;
  const catName = categories.find((c) => c.id === categoryId)?.name ?? "商品";
  const finalTitle = title.trim() || `本日の${catName}`;
  // 写真をアップした場合はそのパス、なければ選択カテゴリに合わせた既定画像
  const finalPhoto = photo || photoForCategory(catName);

  /**
   * 送信前にクライアント側で縮小・再圧縮する（長辺1280px・JPEG品質0.8）。
   * 漁港等の低速回線でスマホ実写真(数MB)をそのまま送らないための対策。
   * 縮小に失敗した場合は元ファイルのまま送る（サーバー側の8MB上限が最終防衛線）。
   */
  async function compressImage(file: File): Promise<Blob> {
    try {
      const bitmap = await createImageBitmap(file);
      const MAX = 1280;
      const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
      if (scale >= 1 && file.size < 500 * 1024) return file; // 小さい画像はそのまま
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.8)
      );
      return blob ?? file;
    } catch {
      return file;
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploadError("");
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.append("file", compressed, "photo.jpg");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = (await res.json()) as { ok: boolean; path?: string; error?: string };
      if (json.ok && json.path) {
        setPhoto(json.path);
      } else {
        setUploadError(json.error ?? "写真を送れませんでした。もう一度お試しください。");
        setPreview("");
      }
    } catch {
      setUploadError("写真を送れませんでした。もう一度お試しください。");
      setPreview("");
    } finally {
      setUploading(false);
    }
  }

  /* ---------- ステップ1: 写真をとる ---------- */
  if (step === 1) {
    return (
      <section>
        <Steps current={1} />
        <StepTitle>1. 写真をとる</StepTitle>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          aria-label="品物の写真をとる・選ぶ"
          style={{ display: "none" }}
          onChange={onFileChange}
        />

        {uploadError && <div className="error-box">{uploadError}</div>}

        {preview ? (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <img
              src={preview}
              alt="とった写真"
              style={{ width: "100%", height: 240, objectFit: "cover" }}
            />
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {uploading && (
                <p style={{ margin: 0, fontWeight: 800, color: "var(--accent)" }}>
                  写真を送信中…そのままお待ちください
                </p>
              )}
              <button
                type="button"
                className="btn btn-primary btn-xl btn-block"
                disabled={uploading || !photo}
                onClick={() => setStep(2)}
              >
                {uploading ? (
                  "送信中…"
                ) : (
                  <>
                    この写真で進む
                    <Icon name="arrow-right" size={20} />
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                disabled={uploading}
                onClick={() => {
                  setPreview("");
                  setPhoto("");
                  fileRef.current?.click();
                }}
              >
                とり直す
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-warm btn-xl btn-block"
              style={{ padding: "30px 20px", fontSize: 20 }}
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="camera" size={24} />
              カメラで写真をとる
            </button>
            <p className="hint" style={{ textAlign: "center", margin: "10px 0 18px" }}>
              品物にカメラを向けて、シャッターを押すだけです
            </p>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => {
                // 写真なし。finalPhoto が選択カテゴリの既定画像を使う
                setPhoto("");
                setPreview("");
                setStep(2);
              }}
            >
              写真なしで進む（あとから足せます）
            </button>
          </>
        )}
      </section>
    );
  }

  /* ---------- ステップ2: 金額を入れる ---------- */
  if (step === 2) {
    return (
      <section>
        <Steps current={2} />
        <StepTitle>2. 金額を入れる</StepTitle>

        <div className="field">
          <label>お渡し金額（あなたが受け取る金額・1つあたり）</label>
          <div className="row">
            <input
              className="input input-xl grow"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              autoFocus
              value={cost}
              onChange={(e) => setCost(e.target.value.replace(/[^0-9]/g, ""))}
            />
            <span style={{ fontSize: 20, fontWeight: 800 }}>円</span>
          </div>
        </div>

        {validCost ? (
          <div className="ok-box" style={{ fontSize: 15 }}>
            お店に出る価格（税込）：
            <b style={{ fontSize: 22 }}>{yen(sale)}</b>
            <span style={{ fontWeight: 600 }}>（手数料{marginRate}%込み）</span>
          </div>
        ) : (
          <p className="hint" style={{ marginBottom: 14 }}>
            金額を入れると、お店に出る価格がここに表示されます。
          </p>
        )}

        <div className="field">
          <label>数量（いくつ売りますか）</label>
          <div className="row" style={{ justifyContent: "center", gap: 20, padding: "4px 0" }}>
            <button
              type="button"
              className="btn btn-ghost"
              aria-label="1つ減らす"
              style={{ fontSize: 28, width: 66, height: 66, borderRadius: 16, padding: 0 }}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <span style={{ fontSize: 36, fontWeight: 800, minWidth: 72, textAlign: "center" }}>
              {qty}
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              aria-label="1つ増やす"
              style={{ fontSize: 28, width: 66, height: 66, borderRadius: 16, padding: 0 }}
              onClick={() => setQty((q) => q + 1)}
            >
              ＋
            </button>
          </div>
        </div>

        <div className="field">
          <label>温度帯（どうやって送りますか）</label>
          <div className="seg">
            {TEMP_ZONES.map((t) => (
              <label key={t.value}>
                <input
                  type="radio"
                  name="wizard_temp"
                  checked={temp === t.value}
                  onChange={() => setTemp(t.value)}
                />
                <span>{t.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label>カテゴリ</label>
          <div className="seg">
            {categories.map((c) => (
              <label key={c.id}>
                <input
                  type="radio"
                  name="wizard_cat"
                  checked={categoryId === c.id}
                  onChange={() => setCategoryId(c.id)}
                />
                <span>{c.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label>商品名（入れなくてもOK）</label>
          <input
            className="input"
            placeholder={`例：朝どれ真ホッケ 5kg箱（空なら「本日の${catName}」になります）`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="btn btn-primary btn-xl btn-block"
          disabled={!validCost}
          onClick={() => setStep(3)}
        >
          次へ（内容を確認する）
          <Icon name="arrow-right" size={20} />
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-block"
          style={{ marginTop: 10 }}
          onClick={() => setStep(1)}
        >
          <Icon name="arrow-left" size={18} />
          写真にもどる
        </button>
      </section>
    );
  }

  /* ---------- ステップ3: 売りに出す ---------- */
  return (
    <section>
      <Steps current={3} />
      <StepTitle>3. この内容で売りに出す</StepTitle>

      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
        <img
          src={preview || finalPhoto}
          alt={finalTitle}
          style={{ width: "100%", height: 200, objectFit: "cover" }}
        />
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 8 }}>{finalTitle}</div>
          <div className="total-row">
            <span>あなたの受取（1つあたり）</span>
            <b>{yen(costNum)}</b>
          </div>
          <div className="total-row">
            <span>お店に出る価格（税込）</span>
            <b>{yen(sale)}</b>
          </div>
          <div className="total-row">
            <span>数量</span>
            <b>{qty}</b>
          </div>
          <div className="total-row">
            <span>温度帯</span>
            <b>{TEMP_LABEL[temp]}</b>
          </div>
          <div className="total-row">
            <span>カテゴリ</span>
            <b>{catName}</b>
          </div>
        </div>
      </div>

      <form action={createListing}>
        <input type="hidden" name="title" value={finalTitle} />
        <input type="hidden" name="category_id" value={categoryId} />
        <input type="hidden" name="cost_price" value={validCost ? costNum : 0} />
        <input type="hidden" name="stock" value={qty} />
        <input type="hidden" name="temp_zone" value={temp} />
        <input type="hidden" name="photo" value={finalPhoto} />
        <SubmitButton />
      </form>
      <button
        type="button"
        className="btn btn-ghost btn-block"
        style={{ marginTop: 10 }}
        onClick={() => setStep(2)}
      >
        <Icon name="arrow-left" size={18} />
        金額にもどる
      </button>
    </section>
  );
}
