import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { StaffRole } from "./auth";

/**
 * Roles we nag about two-factor authentication. Set STRICT_MFA_ENROLMENT to true to block
 * these roles from the CRM until they enrol (do this only after the owner has confirmed
 * their authenticator works — otherwise a lost phone means a locked-out owner).
 * Verification of an already-enrolled factor is always enforced.
 */
export const NUDGE_MFA_ROLES: StaffRole[] = ["owner", "manager"];
export const STRICT_MFA_ENROLMENT = false;

export interface MfaStatus {
  /** Assurance level of the current session: "aal1" (password only) or "aal2" (MFA done). */
  currentLevel: string | null;
  /** Level this account could reach, i.e. "aal2" once a factor is verified. */
  nextLevel: string | null;
  /** A verified factor exists and this session has not passed it yet. */
  needsVerification: boolean;
  /** This role has no factor enrolled and should set one up. */
  shouldEnrol: boolean;
  /** Current session has completed the second factor. */
  verified: boolean;
}

export const NO_MFA: MfaStatus = {
  currentLevel: null,
  nextLevel: null,
  needsVerification: false,
  shouldEnrol: false,
  verified: false,
};

/** Reads the `aal` claim from the access token. Local decode — no network call. */
function accessTokenLevel(accessToken: string | undefined): string | null {
  if (!accessToken) return null;
  try {
    const payload = accessToken.split(".")[1];
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { aal?: string };
    return decoded.aal ?? null;
  } catch {
    return null;
  }
}

/**
 * Works out the account's two-factor state from data we already have: the session's `aal`
 * claim (local JWT decode) and the `factors` on the user record returned by
 * `auth.getUser()`. Deliberately does not call `auth.mfa.getAuthenticatorAssuranceLevel()`,
 * which would issue a second `/user` request on every admin page.
 */
export async function getMfaStatus(
  supabase: SupabaseClient,
  role: StaffRole | null,
  user: User
): Promise<MfaStatus> {
  let currentLevel: string | null = null;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    currentLevel = accessTokenLevel(session?.access_token);
  } catch {
    // Signed out or unreadable session.
  }

  const hasVerifiedFactor = (user.factors ?? []).some(
    (factor) => factor.status === "verified"
  );

  const nextLevel = hasVerifiedFactor ? "aal2" : currentLevel;
  const verified = currentLevel === "aal2";
  const needsVerification = hasVerifiedFactor && !verified;
  const shouldEnrol = !hasVerifiedFactor && Boolean(role && NUDGE_MFA_ROLES.includes(role));

  return { currentLevel, nextLevel, needsVerification, shouldEnrol, verified };
}
