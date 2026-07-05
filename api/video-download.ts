import { fetchVideo, toErrorPayload } from '../server/gemini';

export async function GET(request: Request): Promise<Response> {
  try {
    const uri = new URL(request.url).searchParams.get('uri') ?? '';
    const upstream = await fetchVideo(uri);
    return new Response(upstream.body, {
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'video/mp4',
      },
    });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return Response.json(body, { status });
  }
}
