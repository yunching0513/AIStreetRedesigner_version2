import { fetchStreetView } from '../server/maps';
import { toErrorPayload } from '../server/gemini';

export async function GET(request: Request): Promise<Response> {
  try {
    const params = new URL(request.url).searchParams;
    const upstream = await fetchStreetView({
      pano: params.get('pano'),
      heading: params.get('heading'),
      pitch: params.get('pitch'),
      fov: params.get('fov'),
    });
    return new Response(upstream.body, {
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'image/jpeg',
      },
    });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return Response.json(body, { status });
  }
}
