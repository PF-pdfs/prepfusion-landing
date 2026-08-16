/**
 * Decap CMS OAuth proxy for GitHub, deployed as a Cloudflare Worker.
 *
 * Why this exists: Decap CMS's GitHub login needs to exchange an OAuth
 * "code" for an access token, and that exchange requires the app's client
 * SECRET — which can never be shipped to the browser. This tiny Worker is
 * the only place the secret lives; the static site itself stays 100% client-
 * side and never sees it.
 *
 * Deploy: see ../admin/OAUTH_SETUP.md for the exact one-time setup steps
 * (create the GitHub OAuth App, deploy this Worker, set two secrets).
 *
 * Routes:
 *   GET  /auth       — starts the flow, redirects to GitHub's consent screen
 *   GET  /callback    — GitHub redirects here with a `code`; exchanged for a
 *                        token, then posted back to the admin panel's popup
 *                        window via postMessage, per Decap's OAuth protocol.
 */

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

function randomState() {
  return crypto.randomUUID();
}

function popupHtml(message) {
  // Decap/Netlify CMS's popup protocol: the popup posts a specifically
  // formatted string to window.opener, which is listening for a message
  // event matching this "authorization:<provider>:<status>:<payload>" shape.
  const safe = JSON.stringify(message).replace(/</g, '\\u003c');
  return `<!doctype html><html><body><script>
    (function () {
      function receiveMessage(e) {
        window.opener.postMessage(
          'authorization:github:success:' + ${safe},
          e.origin
        );
        window.removeEventListener('message', receiveMessage, false);
      }
      window.addEventListener('message', receiveMessage, false);
      window.opener.postMessage('authorizing:github', '*');
    })();
  </script></body></html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/auth') {
      const state = randomState();
      const authorizeUrl = new URL(GITHUB_AUTH_URL);
      authorizeUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      authorizeUrl.searchParams.set('redirect_uri', `${url.origin}/callback`);
      authorizeUrl.searchParams.set('scope', 'repo,user');
      authorizeUrl.searchParams.set('state', state);
      return Response.redirect(authorizeUrl.toString(), 302);
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) return new Response('Missing code', { status: 400 });

      const tokenRes = await fetch(GITHUB_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });
      const tokenData = await tokenRes.json();

      if (tokenData.error) {
        return new Response('GitHub OAuth error: ' + tokenData.error_description, { status: 400 });
      }

      return new Response(popupHtml({ token: tokenData.access_token, provider: 'github' }), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
