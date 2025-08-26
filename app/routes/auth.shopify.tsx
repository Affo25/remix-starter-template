import type { LoaderFunction } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { generateNonce, normalizeShopDomain } from "../utils/shopify-oauth";

export const loader: LoaderFunction = async ({ request, context }) => {
  try {
    const url = new URL(request.url);
    const shopParam = url.searchParams.get("shop");
    const embedded = url.searchParams.get("embedded"); // optional embedded flag

    console.log(`[AUTH DEBUG] Starting auth for shop: ${shopParam}`);

    if (!shopParam) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Missing Shop</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h2>Missing Shop Parameter</h2>
          <p>Please provide a shop parameter.</p>
          <p><a href="/install">Go to Installation Page</a></p>
        </body>
        </html>
      `, { status: 400, headers: { "Content-Type": "text/html" } });
    }

    let shop: string;
    try {
      shop = normalizeShopDomain(shopParam);
      console.log(`[AUTH DEBUG] Normalized shop: ${shop}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return new Response(`Invalid shop domain: ${msg}`, { status: 400 });
    }

    const env = context.cloudflare.env as any;
    const clientId = env?.SHOPIFY_API_KEY;
    const redirectUri = `${url.origin}/auth/callback`;
    const scopes = ["read_products", "write_products"];
    const state = generateNonce(); // unique state for CSRF protection

    if (!clientId) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Configuration Error</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h2>App Configuration Error</h2>
          <p>SHOPIFY_API_KEY missing in environment.</p>
        </body>
        </html>
      `, { status: 500, headers: { "Content-Type": "text/html" } });
    }

    // Build OAuth URL
    const authParams = new URLSearchParams({
      client_id: clientId,
      scope: scopes.join(","),
      redirect_uri: redirectUri,
      state,
      response_type: "code",
    });

    const authUrl = `https://${shop}/admin/oauth/authorize?${authParams.toString()}`;
    console.log(`[AUTH DEBUG] OAuth URL: ${authUrl}`);

    // Save state to KV or cookies for validation in callback
    const cookieHeader = `shopify_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`;

    // Embedded apps use App Bridge redirect
    if (embedded === "true") {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <script src="https://unpkg.com/@shopify/app-bridge@3"></script>
          <title>Redirecting to Shopify...</title>
        </head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h2>Redirecting to Shopify...</h2>
          <p>If not redirected automatically, <a href="${authUrl}">click here</a>.</p>
          <script>
            try {
              const AppBridge = window['app-bridge'];
              if (AppBridge) {
                const app = AppBridge.createApp({ apiKey: '${clientId}', shopOrigin: '${shop}' });
                const redirect = AppBridge.actions.Redirect.create(app);
                redirect.dispatch(AppBridge.actions.Redirect.Action.REMOTE, '${authUrl}');
              } else {
                window.top.location.href = '${authUrl}';
              }
            } catch(e) {
              window.top.location.href = '${authUrl}';
            }
          </script>
        </body>
        </html>
      `;
      
      return new Response(htmlContent, {
        headers: {
          "Content-Type": "text/html",
          "Set-Cookie": cookieHeader
        }
      });
    }

    // Standalone apps - redirect directly
    return redirect(authUrl, {
      headers: {
        "Set-Cookie": cookieHeader
      }
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head><title>Server Error</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h2>Server Error</h2>
        <p>${msg}</p>
        <p><a href="/install">Try Again</a></p>
      </body>
      </html>
    `, { status: 500, headers: { "Content-Type": "text/html" } });
  }
};

export default function() {
  return null;
}
