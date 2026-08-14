import { createClient } from "@supabase/supabase-js";
import { allowedPublishers } from "./content";

export type Publisher = { email: string; role: "Admin" | "Publisher" };

export async function requirePublisher(request: Request): Promise<Publisher> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new AuthError("Sign in is required.", 401);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new AuthError("Authentication has not been configured yet.", 503);
  const authClient = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await authClient.auth.getUser(authorization.slice(7));
  if (error || !data.user) throw new AuthError("Your session is invalid or expired.", 401);
  const email = data.user.email?.toLowerCase() ?? "";
  if (!allowedPublishers.includes(email)) throw new AuthError("This account is not approved to publish.", 403);
  return { email, role: email === "ssingh1_phd23@thapar.edu" ? "Admin" : "Publisher" };
}

export class AuthError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
