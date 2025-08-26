import type { LoaderFunction } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { verifyHmac } from "../utils/shopify-oauth";

interface ShopifyTokenResponse {
  access_token: string;
  scope: string;
}

export const loader: LoaderFunction = async ({ request, context }) => {
  try {
    console.log("=== CALLBACK START ===");
    const url = new URL(request.url);
    const params = url.searchParams;
    const shop = params.get("shop");
    const code = params.get("code");
    const state = params.get("state");
    const hmac = params.get("hmac");
    
    console.log("Callback params:", { shop, code: code?.substring(0, 10) + "...", state, hmac: hmac?.substring(0, 10) + "..." });
    
    if (!shop || !code || !state || !hmac) {
      console.log("Missing parameters");
      return new Response("Missing parameters", { status: 400 });
    }

    console.log("Context available:", !!context);
    console.log("Cloudflare context available:", !!context?.cloudflare);
    console.log("Env available:", !!context?.cloudflare?.env);

    const env = context.cloudflare.env as any;
    const apiKey = env?.SHOPIFY_API_KEY;
    const apiSecret = env?.SHOPIFY_API_SECRET;
    
    console.log("API Key present:", !!apiKey);
    console.log("API Secret present:", !!apiSecret);
    
    if (!apiKey || !apiSecret) {
      console.log("Missing Shopify credentials");
      return new Response("Missing Shopify credentials", { status: 500 });
    }

    // Verify state from cookie
    const cookieHeader = request.headers.get("Cookie");
    console.log("Cookie header:", cookieHeader);
    const cookies = new URLSearchParams(cookieHeader?.replace(/; /g, '&'));
    const storedState = cookies.get("oauth_state");
    
    console.log("Stored state:", storedState);
    console.log("Received state:", state);
    
    if (!storedState || storedState !== state) {
      console.log("Invalid state parameter");
      return new Response(`Invalid state parameter. Stored: ${storedState}, Received: ${state}`, { status: 400 });
    }

    // Verify HMAC
    console.log("Verifying HMAC...");
    const isValidHmac = await verifyHmac(params, apiSecret);
    console.log("HMAC valid:", isValidHmac);
    
    // Temporarily skip HMAC validation for development (localhost)
    const isDevelopment = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (!isValidHmac && !isDevelopment) {
      console.log("Invalid HMAC");
      return new Response("Invalid HMAC", { status: 400 });
    }
    
    if (!isValidHmac && isDevelopment) {
      console.log("⚠️  HMAC validation failed, but continuing in development mode");
    }

    // Exchange code for access token
    console.log("Exchanging code for token...");
    const accessTokenUrl = `https://${shop}/admin/oauth/access_token`;
    const body = JSON.stringify({
      client_id: apiKey,
      client_secret: apiSecret,
      code,
    });
    
    console.log("Token exchange URL:", accessTokenUrl);
    
    const tokenRes = await fetch(accessTokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    
    console.log("Token response status:", tokenRes.status);
    
    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error("Token exchange failed:", errorText);
      return new Response(`Failed to get access token: ${errorText}`, { status: 400 });
    }

    const tokenData = await tokenRes.json() as ShopifyTokenResponse;
    console.log("Token data received:", !!tokenData.access_token);
    
    // Validate the token response
    if (!tokenData.access_token) {
      console.error("No access token in response:", tokenData);
      return new Response("Invalid token response", { status: 400 });
    }
    
    // Store access token securely (you might want to encrypt this)
    const redirectUrl = `/dashboard?shop=${shop}&host=${btoa(shop + "/admin")}`;
    console.log("Redirecting to:", redirectUrl);
    
    const response = redirect(redirectUrl);
    response.headers.set("Set-Cookie", `shopify_token=${tokenData.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
    response.headers.set("Set-Cookie", `oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`); // Clear state cookie
  
    console.log("=== CALLBACK END ===");
    return response;
    
  } catch (error) {
    console.error("=== CALLBACK ERROR ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    console.error("Full error object:", error);
    return new Response(`Internal server error: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
  }
};

export default function() {
  return null;
}
