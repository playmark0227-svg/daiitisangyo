"use client";

import { useState, useTransition } from "react";
import { togglePublic } from "@/actions/seller";

/** 売り場に出す / 下げる トグルスイッチ */
export default function PublicToggle({
  id,
  isPublic,
}: {
  id: number;
  isPublic: boolean;
}) {
  const [on, setOn] = useState(isPublic);
  const [pending, startTransition] = useTransition();

  return (
    <span className="row" style={{ gap: 8 }}>
      <label className="toggle" style={pending ? { opacity: 0.5 } : undefined}>
        <input
          type="checkbox"
          checked={on}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.checked;
            setOn(next);
            startTransition(() => togglePublic(id, next));
          }}
        />
        <span className="tg" />
      </label>
      <span
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: on ? "var(--ok)" : "var(--ink-faint)",
        }}
      >
        {pending ? "切替中…" : on ? "売り場に出ています" : "売り場から下げています"}
      </span>
    </span>
  );
}
