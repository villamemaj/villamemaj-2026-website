"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { inputClass, labelClass, buttonClass } from "@/components/admin/ui";

export default function ChangePasswordForm({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const current = String(fd.get("current") ?? "");
    const next = String(fd.get("next") ?? "");
    const confirm = String(fd.get("confirm") ?? "");

    if (next.length < 8) {
      setStatus("error");
      setMessage("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setStatus("error");
      setMessage("New passwords do not match.");
      return;
    }

    setStatus("saving");
    setMessage("");
    const supabase = createSupabaseBrowserClient();

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (authError) {
      setStatus("error");
      setMessage("Current password is incorrect.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    form.reset();
    setStatus("done");
    setMessage("Password updated.");
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <div>
        <label className={labelClass}>Current password</label>
        <input name="current" type="password" autoComplete="current-password" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>New password (min 8)</label>
        <input name="next" type="password" autoComplete="new-password" required minLength={8} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Confirm new password</label>
        <input name="confirm" type="password" autoComplete="new-password" required minLength={8} className={inputClass} />
      </div>

      {message && (
        <p className={`rounded-lg px-3 py-2 text-sm ${status === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>
          {message}
        </p>
      )}

      <button className={buttonClass} disabled={status === "saving"}>
        {status === "saving" ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
