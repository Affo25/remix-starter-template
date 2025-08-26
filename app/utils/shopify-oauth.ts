// Utility functions for Shopify OAuth (Cloudflare compatible)
import crypto from "crypto";

export function getShopifyAuthUrl(shop: string, clientId: string, redirectUri: string, scopes: string[], state: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes.join(","),
    redirect_uri: redirectUri,
    state,
    response_type: "code",
  });
  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

export function generateNonce(length = 16) {
  return crypto.randomBytes(length).toString("hex");
}

export function verifyHmac(query: URLSearchParams, secret: string) {
  const { hmac, ...rest } = Object.fromEntries(query.entries());
  const message = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join("&");
  const generated = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");
  return generated === hmac;
}
