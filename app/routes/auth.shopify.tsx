import type { LoaderFunction } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { getShopifyAuthUrl, generateNonce, normalizeShopDomain } from "../utils/shopify-oauth";

export const loader: LoaderFunction = async ({ request, context }) => {
  try {
    const url = new URL(request.url);
    const shopParam = url.searchParams.get("shop");
    
    console.log(`[AUTH DEBUG] Starting auth for shop: ${shopParam}`);
    console.log(`[AUTH DEBUG] URL: ${url.toString()}`);
    
    if (!shopParam) {
      console.log(`[AUTH ERROR] Missing shop parameter`);
      return new Response("Missing shop parameter", { status: 400 });
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
      return new Response("Missing SHOPIFY_API_KEY environment variable", { status: 500 });
    }
    
    const redirectUri = `${url.origin}/auth/callback`;
    const scopes = ["read_products", "write_products"];
    console.log(`[AUTH DEBUG] Redirect URI: ${redirectUri}`);
    console.log(`[AUTH DEBUG] Scopes: ${scopes.join(', ')}`);
    
    let authUrl: string;
    try {
      authUrl = getShopifyAuthUrl(shop, clientId, redirectUri, scopes, state);
      console.log(`[AUTH DEBUG] Generated auth URL: ${authUrl}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`[AUTH ERROR] Auth URL generation failed: ${errorMessage}`);
      return new Response(`Error generating auth URL: ${errorMessage}`, { status: 500 });
    }
    
    // Store state in a cookie for verification
    const response = redirect(authUrl);
    response.headers.set("Set-Cookie", `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
    console.log(`[AUTH DEBUG] Redirecting to: ${authUrl}`);
    return response;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : '';
    console.log(`[AUTH ERROR] Unhandled error: ${errorMessage}`);
    console.log(`[AUTH ERROR] Stack: ${stack}`);
    return new Response(`Internal server error: ${errorMessage}`, { status: 500 });
  }
};

export default function() {
  return null;
}
