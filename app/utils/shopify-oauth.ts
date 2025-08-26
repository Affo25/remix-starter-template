// Utility functions for Shopify OAuth (Cloudflare compatible)

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
  // Use Web Crypto API instead of Node.js crypto
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifyHmac(query: URLSearchParams, secret: string) {
  const { hmac, ...rest } = Object.fromEntries(query.entries());
  const message = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join("&");
  
  // Use Web Crypto API for HMAC
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  const generated = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return generated === hmac;
}
