import type { LoaderFunction } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { verifyHmac } from "../utils/shopify-oauth";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const params = url.searchParams;
  const shop = params.get("shop");
  const code = params.get("code");
  const state = params.get("state");
  const hmac = params.get("hmac");
  if (!shop || !code || !state || !hmac) {
    return new Response("Missing parameters", { status: 400 });
  }
  // TODO: Verify state from session/cookie
  const secret = process.env.SHOPIFY_API_SECRET!;
  if (!verifyHmac(params, secret)) {
    return new Response("Invalid HMAC", { status: 400 });
  }
  // Exchange code for access token (fetch to Shopify)
  const apiKey = process.env.SHOPIFY_API_KEY!;
  const apiSecret = process.env.SHOPIFY_API_SECRET!;
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
    return new Response("Failed to get access token", { status: 400 });
  }
  // const tokenData = await tokenRes.json();
  // Optionally, store tokenData.access_token for API calls
  // Redirect to Shopify admin embedded app
  const redirectUrl = `https://${shop}/admin/apps/${apiKey}`;
  return redirect(redirectUrl);
};

export default function() {
  return null;
}
