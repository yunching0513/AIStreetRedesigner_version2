import { getVideoStatus, toErrorPayload } from '../server/gemini';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json().catch(() => ({}))) as { operationName?: string };
    const result = await getVideoStatus(body.operationName ?? '');
    return Response.json(result);
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return Response.json(body, { status });
  }
}
