import type { LoaderFunction } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { getShopifyAuthUrl, generateNonce, normalizeShopDomain } from "../utils/shopify-oauth";

export const loader: LoaderFunction = async ({ request, context }) => {
  try {
    const url = new URL(request.url);
    const shopParam = url.searchParams.get("shop");
    const embedded = url.searchParams.get("embedded"); // Check if embedded
    
    console.log(`[AUTH DEBUG] Starting auth for shop: ${shopParam}`);
    console.log(`[AUTH DEBUG] URL: ${url.toString()}`);
    console.log(`[AUTH DEBUG] Embedded mode: ${embedded}`);
    
    if (!shopParam) {
      console.log(`[AUTH ERROR] Missing shop parameter`);
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Missing Shop Parameter</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2>Missing Shop Parameter</h2>
          <p>Please provide a shop parameter in the URL.</p>
          <p><a href="/install">Go to Installation Page</a></p>
        </body>
        </html>
      `, { 
        status: 400,
        headers: { "Content-Type": "text/html" }
      });
    }
    
    let shop: string;
    try {
      shop = normalizeShopDomain(shopParam);
      console.log(`[AUTH DEBUG] Normalized shop: ${shop}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`[AUTH ERROR] Shop normalization failed: ${errorMessage}`);
      return new Response(`Invalid shop domain: ${errorMessage}`, { status: 400 });
    }
    
    let state: string;
    try {
      state = generateNonce();
      console.log(`[AUTH DEBUG] Generated nonce: ${state}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`[AUTH ERROR] Nonce generation failed: ${errorMessage}`);
      return new Response(`Error generating state: ${errorMessage}`, { status: 500 });
    }
    
    const env = context?.cloudflare?.env as any;
    console.log(`[AUTH DEBUG] Environment available: ${!!env}`);
    console.log(`[AUTH DEBUG] Available env keys: ${env ? Object.keys(env).join(', ') : 'none'}`);
    
    const clientId = env?.SHOPIFY_API_KEY;
    console.log(`[AUTH DEBUG] Client ID available: ${!!clientId}`);
    
    if (!clientId) {
      console.log(`[AUTH ERROR] Missing SHOPIFY_API_KEY in environment`);
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Configuration Error</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2>App Configuration Error</h2>
          <p>SHOPIFY_API_KEY environment variable is missing.</p>
          <p>Please contact the app developer.</p>
        </body>
        </html>
      `, { 
        status: 500,
        headers: { "Content-Type": "text/html" }
      });
    }
    
    const redirectUri = `${url.origin}/auth/callback`;
    const scopes = ["read_products", "write_products"];
    console.log(`[AUTH DEBUG] Redirect URI: ${redirectUri}`);
    console.log(`[AUTH DEBUG] Scopes: ${scopes.join(', ')}`);
    
    // Build proper Shopify OAuth authorization URL
    const authParams = new URLSearchParams({
      client_id: clientId,
      scope: scopes.join(','),
      redirect_uri: redirectUri,
      state: state
    });
    
    // Add grant options for better compatibility
    authParams.set('response_type', 'code');
    
    const authUrl = `https://${shop}/admin/oauth/authorize?${authParams.toString()}`;
    console.log(`[AUTH DEBUG] Generated OAuth URL: ${authUrl}`);
    
    // For embedded apps, use App Bridge or direct redirect
    if (embedded === 'true') {
      // Return HTML with App Bridge redirect for embedded apps
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <script src="https://unpkg.com/@shopify/app-bridge@3"></script>
          <title>Redirecting to Shopify...</title>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2>Redirecting to Shopify...</h2>
          <p>If you are not redirected automatically, <a href="${authUrl}">click here</a>.</p>
          <script>
            // Try App Bridge first, fallback to direct redirect
            try {
              const AppBridge = window['app-bridge'];
              if (AppBridge) {
                const app = AppBridge.createApp({
                  apiKey: '${clientId}',
                  shopOrigin: '${shop}'
                });
                const redirect = AppBridge.actions.Redirect.create(app);
                redirect.dispatch(AppBridge.actions.Redirect.Action.REMOTE, '${authUrl}');
              } else {
                window.top.location.href = '${authUrl}';
              }
            } catch (error) {
              console.log('App Bridge failed, using direct redirect:', error);
              window.top.location.href = '${authUrl}';
            }
          </script>
        </body>
        </html>
      `, {
        headers: { "Content-Type": "text/html" }
      });
    }
    
    // For standalone apps, use normal redirect
    const response = redirect(authUrl);
    response.headers.set("Set-Cookie", `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
    console.log(`[AUTH DEBUG] Redirecting to Shopify OAuth: ${authUrl}`);
    return response;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : '';
    console.log(`[AUTH ERROR] Unhandled error: ${errorMessage}`);
    console.log(`[AUTH ERROR] Stack: ${stack}`);
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head><title>Server Error</title></head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h2>Server Error</h2>
        <p>Internal server error: ${errorMessage}</p>
        <p><a href="/install">Try Again</a></p>
      </body>
      </html>
    `, { 
      status: 500,
      headers: { "Content-Type": "text/html" }
    });
  }
};

export default function() {
  return null;
}
