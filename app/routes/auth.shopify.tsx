import type { LoaderFunction } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { getShopifyAuthUrl, generateNonce } from "../utils/shopify-oauth";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  if (!shop) {
    return new Response("Missing shop parameter", { status: 400 });
  }
  const state = generateNonce();
  const clientId = process.env.SHOPIFY_API_KEY!;
  const redirectUri = `${url.origin}/auth/callback`;
  const scopes = ["read_products", "write_products"];
  const authUrl = getShopifyAuthUrl(shop, clientId, redirectUri, scopes, state);
  // You should store the state in a cookie/session for verification
  return redirect(authUrl);
};

export default function() {
  return null;
}
