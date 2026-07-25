/*  PM Designer Boutique — GitHub API Proxy Worker
    Stores GitHub token securely as a Worker Secret.
    Frontend sends requests here; Worker forwards to GitHub API.
    Env vars: GH_USER, GH_REPO
    Secrets:  GH_TOKEN */

const ALLOWED_ORIGINS = [
  'https://pmboutique3.pages.dev',
  'http://localhost:8888',
  'http://localhost:5000'
];

function corsHeaders(origin) {
  var allow = ALLOWED_ORIGINS.indexOf(origin) !== -1 ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {})
  });
}

export default {
  async fetch(request, env) {
    var origin = request.headers.get('Origin') || '';
    var h = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: h });
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
        var method = body.method || 'GET';
        var ghPath = body.path || '';
        var ghBody = body.body || null;

        if (!ghPath) return json({ error: 'Missing path' }, 400, h);

        var ghUrl = 'https://api.github.com/' + ghPath;
        var ghHeaders = {
          'Authorization': 'token ' + env.GH_TOKEN,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'PM-Boutique-Worker'
        };

        var ghOpts = { method: method, headers: ghHeaders };
        if (ghBody && (method === 'PUT' || method === 'POST' || method === 'PATCH')) {
          ghHeaders['Content-Type'] = 'application/json';
          ghOpts.body = JSON.stringify(ghBody);
        } else if (ghBody && method === 'DELETE') {
          ghHeaders['Content-Type'] = 'application/json';
          ghOpts.body = JSON.stringify(ghBody);
        }

        var res = await fetch(ghUrl, ghOpts);
        var text = await res.text();

        return new Response(text, {
          status: res.status,
          headers: Object.assign(h, {
            'Content-Type': 'application/json'
          })
        });
      }

      return json({ error: 'Not found', endpoints: ['/api/connect (GET)', '/api/github (POST)'] }, 404, h);

    } catch (e) {
      return json({ error: e.message || 'Worker error' }, 500, h);
    }
  }
};
