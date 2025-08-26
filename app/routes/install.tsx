import type { LoaderFunction, MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { redirect } from "@remix-run/cloudflare";

interface LoaderData {
  shop?: string;
  appUrl: string;
}

export const loader: LoaderFunction = async ({ request, context }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  // If shop is provided, redirect to OAuth
  if (shop) {
    return redirect(`/auth/shopify?shop=${shop}`);
  }

  const env = context.cloudflare.env as any;
  const appUrl = env.SHOPIFY_APP_URL || url.origin;
  
  return { shop, appUrl };
};

export const meta: MetaFunction = () => {
  return [
    { title: "Install Video Reels App" },
    { name: "description", content: "Install the Video Reels app for your Shopify store" },
  ];
};

export default function Install() {
  const { appUrl } = useLoaderData<LoaderData>();

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
        
        <form method="GET" action="/auth/shopify">
          <div style={{ marginBottom: "1rem" }}>
            <input
              type="text"
              name="shop"
              placeholder="your-store.myshopify.com"
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "1rem"
              }}
            />
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