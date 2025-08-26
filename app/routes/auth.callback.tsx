import type { LoaderFunction } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import crypto from "crypto";

interface ShopifyTokenResponse {
  access_token: string;
  scope: string;
}

/**
 * Verify HMAC for official Shopify OAuth
 */
function verifyHmac(query: URLSearchParams, apiSecret: string): boolean {
  const { hmac, ...rest } = Object.fromEntries(query.entries());
  const sortedParams = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join("&");

  const hash = crypto
    .createHmac("sha256", apiSecret)
    .update(sortedParams)
    .digest("hex");

  return hash === hmac;
}

export const loader: LoaderFunction = async ({ request, context }) => {
  try {
    console.log("=== OFFICIAL CALLBACK START ===");

    const url = new URL(request.url);
    const params = url.searchParams;

    const shop = params.get("shop");
    const code = params.get("code");
    const state = params.get("state");
    const hmac = params.get("hmac");

    if (!shop || !code || !hmac || !state) {
      return new Response("Missing required OAuth parameters.", { status: 400 });
    }

    const env = context.cloudflare.env as any;
    const apiKey = env?.SHOPIFY_API_KEY;
    const apiSecret = env?.SHOPIFY_API_SECRET;
    const storedState = env?.SHOPIFY_OAUTH_STATE; // Or retrieve from KV/session

    if (!apiKey || !apiSecret) {
      return new Response("Shopify API credentials not configured.", { status: 500 });
    }

    // Verify HMAC
    if (!verifyHmac(params, apiSecret)) {
      return new Response("HMAC validation failed. Request may be forged.", { status: 400 });
    }

    // Verify state
    if (state !== storedState) {
      return new Response("Invalid state parameter.", { status: 400 });
    }

    // Exchange code for access token
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      return new Response(`Token exchange failed: ${errorText}`, { status: 400 });
    }

    const tokenData = (await tokenRes.json()) as ShopifyTokenResponse;

    if (!tokenData.access_token) {
      return new Response("No access token received from Shopify.", { status: 400 });
    }

    // Success - set cookies and redirect
    const redirectUrl = `/dashboard?shop=${shop}&host=${btoa(shop + "/admin")}`;
    const response = redirect(redirectUrl);

    response.headers.set(
      "Set-Cookie",
      `shopify_token=${tokenData.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    );
    response.headers.append(
      "Set-Cookie",
      `shopify_shop=${shop}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    );

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return new Response("Internal server error during OAuth callback.", { status: 500 });
  }
};

export default function () {
  return null;
}
