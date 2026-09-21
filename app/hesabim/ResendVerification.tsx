"use client";

import { useActionState } from "react";
import { resendEmailVerification, type ResendVerificationState } from "@/app/uyelik/actions";

const initialState: ResendVerificationState = { error: null, message: null };

export default function ResendVerification() {
  const [state, formAction, pending] = useActionState(resendEmailVerification, initialState);

  return (
    <form action={formAction} className="space-y-2">
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
      >
        {pending ? "Gönderiliyor..." : "Doğrulama e-postası gönder"}
      </button>
      {state.message && <p className="text-sm text-emerald-700">{state.message}</p>}
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
    </form>
  );
}
