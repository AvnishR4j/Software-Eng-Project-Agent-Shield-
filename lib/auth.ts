import { allowedPublishers } from "./content";
import { runtimeEnv } from "./storage";

export type Publisher = { email: string; role: "Admin" | "Publisher" };

export async function requirePublisher(request: Request): Promise<Publisher> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new AuthError("Sign in is required.", 401);

  const url = runtimeEnv.SUPABASE_URL;
  const key = runtimeEnv.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new AuthError("Authentication has not been configured yet.", 503);

  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, Authorization: authorization },
  });
  if (!response.ok) throw new AuthError("Your session is invalid or expired.", 401);
  const user = await response.json() as { email?: string };
  const email = user.email?.toLowerCase() ?? "";
  if (!allowedPublishers.includes(email)) throw new AuthError("This account is not approved to publish.", 403);
  return { email, role: email === "ssingh1_phd23@thapar.edu" ? "Admin" : "Publisher" };
}

export class AuthError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}
