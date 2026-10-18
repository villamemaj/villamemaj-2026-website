"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { buttonClass, buttonSecondaryClass, inputClass } from "@/components/admin/ui";

interface Factor {
  id: string;
  friendly_name?: string | null;
  status: string;
  created_at?: string;
}

interface MfaState {
  level: string | null;
  factors: Factor[];
}

const BASE_NAME = "Authenticator app";

async function fetchMfaState(): Promise<MfaState> {
  const supabase = createSupabaseBrowserClient();
  const [{ data: assurance }, { data: listed }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);
  return {
    level: assurance?.currentLevel ?? null,
    factors: (listed?.totp ?? []) as Factor[],
  };
}

function message(error: unknown, fallback: string) {
  const text = error instanceof Error ? error.message : String(error ?? "");
  if (/mfa_verification_failed|invalid/i.test(text)) {
    return "That code is not correct. Codes change every 30 seconds — enter the current one.";
  }
  if (/insufficient_aal/i.test(text)) {
    return "Please enter your current authenticator code here first, then try again.";
  }
  if (/name_conflict/i.test(text)) {
    return "An unfinished setup is blocking this. Remove it below, then start again.";
  }
  return text || fallback;
}

export default function MfaPanel({
  next,
  initialVerified,
  initialHasFactor,
}: {
  next: string;
  initialVerified: boolean;
  initialHasFactor: boolean;
}) {
  const router = useRouter();
  const [level, setLevel] = useState<string | null>(
    initialVerified ? "aal2" : initialHasFactor ? "aal1" : null
  );
  const [hasFactor, setHasFactor] = useState(initialHasFactor);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrolment, setEnrolment] = useState<{ id: string; secret: string; qr: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const verifiedFactor = factors.find((f) => f.status === "verified");
  const unfinished = factors.filter((f) => f.status !== "verified");

  function applyState(state: MfaState) {
    setLevel(state.level);
    setFactors(state.factors);
    setHasFactor(state.factors.some((f) => f.status === "verified"));
  }

  function reload() {
    void fetchMfaState().then(applyState);
  }

  useEffect(() => {
    let active = true;
    void fetchMfaState().then((state) => {
      if (active) applyState(state);
    });
    return () => {
      active = false;
    };
    // Runs once on mount; reload() covers later refreshes.
  }, []);

  async function startEnrolment() {
    setBusy(true);
    setError("");
    const supabase = createSupabaseBrowserClient();

    // Names must be unique per account, otherwise an abandoned setup blocks a retry.
    const used = factors.filter((f) => (f.friendly_name ?? BASE_NAME).startsWith(BASE_NAME)).length;
    const friendlyName = used === 0 ? BASE_NAME : `${BASE_NAME} ${used + 1}`;

    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName });

    if (error || !data) {
      setError(message(error, "Could not start setup. Please try again."));
      setBusy(false);
      return;
    }

    setEnrolment({ id: data.id, secret: data.totp.secret, qr: data.totp.qr_code });
    setBusy(false);
  }

  async function submitCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const supabase = createSupabaseBrowserClient();
    let factorId = enrolment?.id ?? verifiedFactor?.id;

    if (!factorId) {
      const { data } = await supabase.auth.mfa.listFactors();
      const totp = (data?.totp ?? []) as Factor[];
      factorId = totp.find((f) => f.status === "verified")?.id;
    }

    if (!factorId) {
      setError("No authenticator is registered on this account. Reload and set one up.");
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });

    if (error) {
      setError(message(error, "Verification failed."));
      setBusy(false);
      return;
    }

    router.push(next || "/admin");
    router.refresh();
  }

  async function removeFactor(factorId: string, confirmText: string) {
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    setError("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    if (error) {
      setError(message(error, "Could not remove the authenticator."));
      return;
    }
    if (enrolment?.id === factorId) setEnrolment(null);
    setCode("");
    reload();
  }

  // Step 1 of setup: scan the QR, then confirm with the first code it produces.
  if (enrolment) {
    return (
      <div className="space-y-4">
        <ol className="list-inside list-decimal space-y-1 text-sm text-slate-600">
          <li>Open your authenticator app (Google Authenticator, Authy, 1Password…).</li>
          <li>Scan the code below, or type the key in manually.</li>
          <li>Enter the 6-digit code the app shows.</li>
        </ol>

        <div className="flex justify-center rounded-xl border border-slate-200 p-4">
          <div
            className="w-44 [&>svg]:h-auto [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: enrolment.qr }}
          />
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Manual key</p>
          <p className="mt-1 break-all font-mono text-sm text-slate-700">
            {enrolment.secret.replace(/(.{4})/g, "$1 ").trim()}
          </p>
        </div>

        <form onSubmit={submitCode} className="space-y-3">
          <label htmlFor="code" className="block text-sm font-medium text-slate-700">
            6-digit code
          </label>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className={inputClass}
          />

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className={`${buttonClass} w-full justify-center`}
          >
            {busy ? "Verifying…" : "Turn on two-factor"}
          </button>
          <button
            type="button"
            onClick={() => removeFactor(enrolment.id, "Discard this unfinished setup?")}
            disabled={busy}
            className={`${buttonSecondaryClass} w-full justify-center`}
          >
            Cancel
          </button>
        </form>
      </div>
    );
  }

  // A factor is registered but this session has not passed it yet.
  if (level !== "aal2" && hasFactor) {
    return (
      <form onSubmit={submitCode} className="space-y-4">
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">
          Enter the current code from your authenticator app to finish signing in.
        </p>

        <div>
          <label htmlFor="code" className="block text-sm font-medium text-slate-700">
            6-digit code
          </label>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className={`${inputClass} mt-1`}
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={busy || code.length !== 6}
          className={`${buttonClass} w-full justify-center`}
        >
          {busy ? "Checking…" : "Verify and continue"}
        </button>
      </form>
    );
  }

  // Verified session: show status and allow managing factors.
  if (level === "aal2") {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Two-factor authentication is active for this session.
        </p>

        {factors.length > 0 && (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {factors.map((factor) => (
              <li key={factor.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-slate-900">{factor.friendly_name || BASE_NAME}</p>
                  <p className="text-xs text-slate-500">
                    {factor.status === "verified" ? "Verified" : "Not verified yet"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    removeFactor(
                      factor.id,
                      "Remove this authenticator? You will only need your password to sign in."
                    )
                  }
                  disabled={busy}
                  className="text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="button"
          onClick={() => {
            setCode("");
            void startEnrolment();
          }}
          disabled={busy}
          className={`${buttonSecondaryClass} w-full justify-center`}
        >
          Add another device
        </button>
      </div>
    );
  }

  // No factor yet.
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Two-factor authentication is not set up on this account. Anyone with your password can
        currently reach guest details and payments.
      </p>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button
        type="button"
        onClick={startEnrolment}
        disabled={busy}
        className={`${buttonClass} w-full justify-center`}
      >
        {busy ? "Starting…" : "Set up authenticator app"}
      </button>

      {unfinished.length > 0 && (
        <>
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            An unfinished setup is stored on your account. Remove it, or start again above.
          </p>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {unfinished.map((factor) => (
              <li key={factor.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-slate-600">
                  {factor.friendly_name || BASE_NAME} · not verified
                </span>
                <button
                  type="button"
                  onClick={() => removeFactor(factor.id, "Remove this unfinished setup?")}
                  disabled={busy}
                  className="text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
