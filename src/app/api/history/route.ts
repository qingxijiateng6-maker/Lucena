import { getOptionalSessionUser } from "@/lib/auth/session";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { responseFromError } from "@/lib/api/error-mapping";
import { jsonOk } from "@/lib/api/responses";
import { getHistory } from "@/lib/sessions/service";

export async function GET() {
  try {
    const user = requireAuthenticatedUser(await getOptionalSessionUser());
    return jsonOk(await getHistory(user));
  } catch (error) {
    return responseFromError(error);
  }
}
