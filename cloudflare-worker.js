// Static Assets does not serve byte ranges. The Workers Cache API does,
// so cache complete MP4 responses by ETag before requesting a byte range.
// https://developers.cloudflare.com/workers/runtime-apis/cache/#match
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.endsWith('.mp4')) return env.ASSETS.fetch(request);

    const headers = new Headers(request.headers);
    headers.delete('Range');
    headers.delete('If-Range');
    const fullRequest = new Request(request, { headers });
    const source = await env.ASSETS.fetch(fullRequest);
    if (source.status !== 200 || request.method === 'HEAD') return source;

    const responseHeaders = new Headers(source.headers);
    responseHeaders.set('Accept-Ranges', 'bytes');
    const fullResponse = () => new Response(source.body, {
      status: source.status, headers: responseHeaders,
    });
    const range = request.headers.get('Range');
    const etag = source.headers.get('ETag');
    const ifRange = request.headers.get('If-Range');
    if (request.method !== 'GET' || !range || !/^bytes=(?:\d+-\d*|-\d+)$/.test(range)
      || !etag
      || (ifRange && (ifRange.startsWith('W/') || ifRange !== etag))) {
      return fullResponse();
    }

    // Include the asset hash so a new deployment never serves an old video.
    url.search = '';
    url.searchParams.set('__niki_video_etag', etag);
    const key = new Request(url, { method: 'GET' });
    const rangeRequest = new Request(key, { headers: { Range: range } });
    const cache = caches.default;
    let cached = await cache.match(rangeRequest);
    if (cached) {
      await source.body.cancel();
    } else {
      const cacheHeaders = new Headers(responseHeaders);
      cacheHeaders.set('Cache-Control', 'public, max-age=86400');
      try {
        await cache.put(key, new Response(source.body, { headers: cacheHeaders }));
        cached = await cache.match(rangeRequest);
      } catch {
        // A cache outage should not prevent ordinary video playback.
      }
      if (!cached) return env.ASSETS.fetch(fullRequest);
    }
    const result = new Response(cached.body, cached);
    result.headers.set('Accept-Ranges', 'bytes');
    result.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    return result;
  },
};
