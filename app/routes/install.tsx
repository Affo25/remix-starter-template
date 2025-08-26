import type { LoaderFunction, MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { redirect } from "@remix-run/cloudflare";

interface LoaderData {
  shop?: string;
  appUrl: string;
  error?: string;
}

export const loader: LoaderFunction = async ({ request, context }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const error = url.searchParams.get("error");
  
  // If shop is provided, redirect to OAuth
  if (shop) {
    return redirect(`/auth/shopify?shop=${shop}`);
  }

  const env = context.cloudflare.env as any;
  const appUrl = env.SHOPIFY_APP_URL || url.origin;
  
  return { shop, appUrl, error };
};

export const meta: MetaFunction = () => {
  return [
    { title: "Install Video Reels App" },
    { name: "description", content: "Install the Video Reels app for your Shopify store" },
  ];
};

export default function Install() {
  const { appUrl, error } = useLoaderData<LoaderData>();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f6f6f7",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "2rem",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        maxWidth: "400px",
        width: "100%",
        textAlign: "center"
      }}>
        <h1 style={{ color: "#202223", marginBottom: "1rem" }}>
          Video Reels App
        </h1>
        <p style={{ color: "#6d7175", marginBottom: "2rem" }}>
          Enhance your Shopify store with engaging video reels
        </p>

        {error && (
          <div style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            padding: "0.75rem",
            borderRadius: "4px",
            marginBottom: "1rem",
            fontSize: "0.875rem"
          }}>
            {error}
          </div>
        )}
        
        <form method="GET" action="/auth/shopify">
          <div style={{ marginBottom: "1rem" }}>
            <input
              type="text"
              name="shop"
              placeholder="Enter your store name (e.g., my-store or my-store.myshopify.com)"
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: error ? "1px solid #dc2626" : "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "1rem"
              }}
            />
            <small style={{ 
              color: "#6d7175", 
              fontSize: "0.75rem",
              marginTop: "0.25rem",
              display: "block",
              textAlign: "left"
            }}>
              You can enter just your store name or the full domain
            </small>
          </div>
          <button
            type="submit"
            style={{
              width: "100%",
              backgroundColor: "#5c6ac4",
              color: "white",
              padding: "0.75rem",
              border: "none",
              borderRadius: "4px",
              fontSize: "1rem",
              cursor: "pointer"
            }}
          >
            Install App
          </button>
        </form>

        {/* Quick install for omarketdev store */}
        <div style={{ 
          marginTop: "1.5rem", 
          padding: "1rem", 
          backgroundColor: "#f0f9ff", 
          border: "1px solid #bae6fd", 
          borderRadius: "4px" 
        }}>
          <p style={{ color: "#0c4a6e", fontWeight: "bold", marginBottom: "0.5rem" }}>
            Quick Install for omarketdev Store
          </p>
          <button
            onClick={() => window.open('https://omarketdev.myshopify.com/admin/oauth/install_custom_app?client_id=530c19613359ffe4a76c4dc0324838ee', '_blank')}
            style={{
              backgroundColor: "#0369a1",
              color: "white",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "4px",
              fontSize: "0.875rem",
              cursor: "pointer"
            }}
          >
            Install on omarketdev Store
          </button>
        </div>

        <div style={{ marginTop: "2rem", fontSize: "0.875rem", color: "#6d7175" }}>
          <p>Don't have a Shopify store?</p>
          <a 
            href="https://www.shopify.com" 
            style={{ color: "#5c6ac4", textDecoration: "none" }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Create one here
          </a>
        </div>
      </div>
    </div>
  );
}