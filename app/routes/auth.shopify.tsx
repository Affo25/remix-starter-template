import type { LoaderFunction } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { getShopifyAuthUrl, generateNonce, normalizeShopDomain } from "../utils/shopify-oauth";

export const loader: LoaderFunction = async ({ request, context }) => {
  const url = new URL(request.url);
  const shopParam = url.searchParams.get("shop");
  if (!shopParam) {
    return new Response("Missing shop parameter", { status: 400 });
  }
  
  let shop: string;
  try {
    shop = normalizeShopDomain(shopParam);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Invalid shop domain: ${errorMessage}`, { status: 400 });
  }
  
  const state = generateNonce();
  const env = context.cloudflare.env as any;
  const clientId = env.SHOPIFY_API_KEY;
  
  if (!clientId) {
    return new Response("Missing SHOPIFY_API_KEY", { status: 500 });
  }
  
  const redirectUri = `${url.origin}/auth/callback`;
  const scopes = ["read_products", "write_products"];
  const authUrl = getShopifyAuthUrl(shop, clientId, redirectUri, scopes, state);
  
  // Store state in a cookie for verification
  const response = redirect(authUrl);
  response.headers.set("Set-Cookie", `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
  return response;
};

export default function() {
  return null;
}
