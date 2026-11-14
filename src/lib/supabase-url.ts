/** Accepts the project URL even if it was pasted with /rest/v1 or a trailing slash. */
export function supabaseUrl() {
  const raw = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  return raw.replace(/\/+$/, "").replace(/\/(rest|auth|storage)\/v1.*$/, "").replace(/\/+$/, "");
}
