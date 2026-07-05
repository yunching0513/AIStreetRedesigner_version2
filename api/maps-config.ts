import { getMapsConfig } from '../server/maps';
import { toErrorPayload } from '../server/gemini';

export async function GET(): Promise<Response> {
  try {
    return Response.json(getMapsConfig());
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return Response.json(body, { status });
  }
}
