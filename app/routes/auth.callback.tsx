import type { LoaderFunction } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { verifyHmac } from "../utils/shopify-oauth";

interface ShopifyTokenResponse {
  access_token: string;
  scope: string;
}

export const loader: LoaderFunction = async ({ request, context }) => {
  const url = new URL(request.url);
  const params = url.searchParams;
  const shop = params.get("shop");
  const code = params.get("code");
  const state = params.get("state");
  const hmac = params.get("hmac");
  
  if (!shop || !code || !state || !hmac) {
    return new Response("Missing parameters", { status: 400 });
  }

  const env = context.cloudflare.env as any;
  const apiKey = env.SHOPIFY_API_KEY;
  const apiSecret = env.SHOPIFY_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    return new Response("Missing Shopify credentials", { status: 500 });
  }

  // Verify state from cookie
  const cookieHeader = request.headers.get("Cookie");
  const cookies = new URLSearchParams(cookieHeader?.replace(/; /g, '&'));
  const storedState = cookies.get("oauth_state");
  
  if (!storedState || storedState !== state) {
    return new Response("Invalid state parameter", { status: 400 });
  }

  // Verify HMAC
  const isValidHmac = await verifyHmac(params, apiSecret);
  if (!isValidHmac) {
    return new Response("Invalid HMAC", { status: 400 });
  }

  // Exchange code for access token
  const accessTokenUrl = `https://${shop}/admin/oauth/access_token`;
  const body = JSON.stringify({
    client_id: apiKey,
    client_secret: apiSecret,
    code,
  });
  
  const tokenRes = await fetch(accessTokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  
  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    console.error("Token exchange failed:", errorText);
    return new Response(`Failed to get access token: ${errorText}`, { status: 400 });
  }

  const tokenData = await tokenRes.json() as ShopifyTokenResponse;
  
  // Validate the token response
  if (!tokenData.access_token) {
    console.error("No access token in response:", tokenData);
    return new Response("Invalid token response", { status: 400 });
  }
  
  // Store access token securely (you might want to encrypt this)
  const response = redirect(`/dashboard?shop=${shop}&host=${btoa(shop + "/admin")}`);
  response.headers.set("Set-Cookie", `shopify_token=${tokenData.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
  response.headers.set("Set-Cookie", `oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`); // Clear state cookie
  
  return response;
};

export default function() {
  return null;
}
