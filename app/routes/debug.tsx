import type { LoaderFunction } from "@remix-run/cloudflare";

export const loader: LoaderFunction = async ({ request, context }) => {
  // Only allow debug in development or specific conditions
  const url = new URL(request.url);
  const debugKey = url.searchParams.get("key");
  
  // Simple security - you can remove this route after debugging
  if (debugKey !== "debug123") {
    return new Response("Debug access denied", { status: 403 });
  }

  const env = context?.cloudflare?.env as any;
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment_keys: env ? Object.keys(env) : [],
    shopify_api_key_exists: !!env?.SHOPIFY_API_KEY,
    shopify_api_secret_exists: !!env?.SHOPIFY_API_SECRET,
    shopify_scopes_exists: !!env?.SHOPIFY_SCOPES,
    shopify_api_key_prefix: env?.SHOPIFY_API_KEY ? env.SHOPIFY_API_KEY.substring(0, 8) + "..." : "NOT_SET",
    request_url: url.toString(),
    user_agent: request.headers.get("user-agent"),
  };

  return new Response(`
    <!DOCTYPE html>
    <html>
    <head><title>Debug Info</title></head>
    <body style="font-family: monospace; padding: 20px;">
      <h2>🔧 Debug Information</h2>
      <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
      <hr>
      <h3>Test OAuth URL:</h3>
      <a href="/auth/shopify?shop=omarketdev.myshopify.com" target="_blank">
        Test OAuth Flow
      </a>
    </body>
    </html>
  `, {
    headers: { "Content-Type": "text/html" }
  });
};

export default function() {
  return null;
}