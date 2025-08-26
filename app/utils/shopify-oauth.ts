// Utility functions for Shopify OAuth (Cloudflare compatible)

export function normalizeShopDomain(input: string): string {
  let shop = input.trim();
  
  // Handle Shopify admin URL format: https://admin.shopify.com/store/{shop-name}
  const adminUrlMatch = shop.match(/^https?:\/\/admin\.shopify\.com\/store\/([a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]*)$/);
  if (adminUrlMatch) {
    shop = adminUrlMatch[1];
  } else {
    // Remove protocol if present
    shop = shop.replace(/^https?:\/\//, '');
    
    // Remove trailing slash if present
    shop = shop.replace(/\/$/, '');
    
    // Remove .myshopify.com if present (we'll add it back)
    shop = shop.replace(/\.myshopify\.com$/, '');
  }
  
  // Basic validation for shop name (before adding .myshopify.com)
  // Shop names must be at least 1 character, alphanumeric and hyphens only, cannot start or end with hyphen
  if (!/^[a-zA-Z0-9]+([a-zA-Z0-9\-]*[a-zA-Z0-9])?$/.test(shop)) {
    throw new Error(`Invalid shop domain format: ${shop}`);
  }
  
  // Add .myshopify.com
  return `${shop}.myshopify.com`;
}

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
  
  console.log("HMAC Debug:");
  console.log("- Received HMAC:", hmac);
  console.log("- Message for verification:", message);
  console.log("- Secret length:", secret.length);
  
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
  
  console.log("- Generated HMAC:", generated);
  console.log("- Match:", generated === hmac);
  
  return generated === hmac;
}
