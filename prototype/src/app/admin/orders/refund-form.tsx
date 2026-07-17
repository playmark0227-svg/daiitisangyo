"use client";

import { adminApproveRefund } from "@/actions/admin";

/** 返金ボタン（送信前に確認ダイアログを出す） */
export default function RefundForm({
  orderId,
  label,
  confirmText,
  className,
}: {
  orderId: number;
  label: string;
  confirmText: string;
  className?: string;
}) {
  return (
    <form
      action={adminApproveRefund}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <button className={className ?? "btn btn-danger"} type="submit">
        {label}
      </button>
    </form>
  );
}
