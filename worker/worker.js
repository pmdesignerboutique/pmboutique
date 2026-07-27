/*  PM Designer Boutique — GitHub API Proxy Worker (Secured)
    Env vars:  GH_USER, GH_REPO, ALLOWED_ORIGINS
    Secrets:   GH_TOKEN, API_KEY */

const VALID_METHODS = ['GET', 'PUT', 'DELETE'];
const MAX_BODY_SIZE = 15 * 1024 * 1024;
const ALLOWED_PATHS = /^repos\/[^/]+\/[^/]+\/contents\//;

function getOrigins(env) {
  var raw = env.ALLOWED_ORIGINS || '';
  return raw.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {})
  });
}

function corsHeaders(origin, env) {
  var origins = getOrigins(env);
  var allow = origins.indexOf(origin) !== -1 ? origin : origins[0] || '';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    'Access-Control-Max-Age': '86400',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  };
}

function verifyApiKey(request, env) {
  var key = request.headers.get('X-API-Key') || '';
  if (!key || key !== env.API_KEY) return false;
  return true;
}

export default {
  async fetch(request, env) {
    var origin = request.headers.get('Origin') || '';
    var h = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: h });
    }

    if (!verifyApiKey(request, env)) {
      return json({ error: 'Unauthorized' }, 401, h);
    }

    var url = new URL(request.url);
    var path = url.pathname;

    try {
      /* ===== Health check / connect ===== */
      if (path === '/api/connect' && request.method === 'GET') {
        var r = await fetch('https://api.github.com/repos/' + env.GH_USER + '/' + env.GH_REPO, {
          headers: {
            'Authorization': 'token ' + env.GH_TOKEN,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'PM-Boutique-Worker'
          }
        });
        if (!r.ok) return json({ error: 'GitHub ' + r.status }, 502, h);
        var d = await r.json();
        return json({ ok: true, full_name: d.full_name }, 200, h);
      }

      /* ===== Generic GitHub proxy ===== */
      if (path === '/api/github' && request.method === 'POST') {
        var body = await request.json();
        var method = (body.method || 'GET').toUpperCase();
        var ghPath = body.path || '';
        var ghBody = body.body || null;

        if (!ghPath) return json({ error: 'Missing path' }, 400, h);
        if (VALID_METHODS.indexOf(method) === -1) return json({ error: 'Method not allowed' }, 405, h);
        if (!ALLOWED_PATHS.test(ghPath)) return json({ error: 'Path not allowed' }, 403, h);
        if (ghPath.indexOf(env.GH_USER) === -1) return json({ error: 'Repo mismatch' }, 403, h);

        var ghUrl = 'https://api.github.com/' + ghPath;
        var ghHeaders = {
          'Authorization': 'token ' + env.GH_TOKEN,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'PM-Boutique-Worker'
        };

        var ghOpts = { method: method, headers: ghHeaders };
        if (ghBody && (method === 'PUT' || method === 'DELETE')) {
          ghHeaders['Content-Type'] = 'application/json';
          ghOpts.body = JSON.stringify(ghBody);
        }

        var res = await fetch(ghUrl, ghOpts);
        var text = await res.text();

        return new Response(text, {
          status: res.status,
          headers: Object.assign(h, { 'Content-Type': 'application/json' })
        });
      }

      return json({ error: 'Not found' }, 404, h);

    } catch (e) {
      return json({ error: 'Worker error' }, 500, h);
    }
  }
};
