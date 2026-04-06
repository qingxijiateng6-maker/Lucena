import { getOptionalSessionUser } from "@/lib/auth/session";
import { jsonOk } from "@/lib/api/responses";

export async function GET() {
  const user = await getOptionalSessionUser();

  if (!user) {
    return jsonOk({ authenticated: false });
  }

  return jsonOk({
    authenticated: true,
    user,
  });
}
