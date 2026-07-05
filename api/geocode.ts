import { geocode } from '../server/maps';
import { toErrorPayload } from '../server/gemini';

export async function GET(request: Request): Promise<Response> {
  try {
    const query = new URL(request.url).searchParams.get('q') ?? '';
    return Response.json(await geocode(query));
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return Response.json(body, { status });
  }
}
