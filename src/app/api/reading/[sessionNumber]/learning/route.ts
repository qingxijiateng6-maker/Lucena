import { jsonOk } from "@/lib/api/responses";
import { responseFromError } from "@/lib/api/error-mapping";
import { parseSessionNumber } from "@/lib/validation/schemas";
import { getLearningPayload } from "@/lib/sessions/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionNumber: string }> },
) {
  try {
    const { sessionNumber } = await params;
    return jsonOk(
      await getLearningPayload("reading", parseSessionNumber(sessionNumber)),
    );
  } catch (error) {
    return responseFromError(error);
  }
}
