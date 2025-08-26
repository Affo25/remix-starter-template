import { useState } from 'react';
import type { LoaderFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { redirect } from "@remix-run/cloudflare";
import {
  Page,
  Card,
  TextContainer,
  Layout,
  Form,
  FormLayout,
  TextField,
  Select,
  Button
} from '@shopify/polaris';

interface LoaderData {
  shop: string;
  host: string | null;
  isEmbedded: boolean;
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  
  // Check if we're being loaded within Shopify admin iframe
  const shop = url.searchParams.get("shop");
  const host = url.searchParams.get("host");
  
  // If we have shop and host parameters, we're being loaded from Shopify
  if (shop && host) {
    return { shop, host, isEmbedded: true };
  }
  
  // If no shop parameter, redirect to installation flow
  if (!shop) {
    return redirect("/install");
  }
  
  return { shop, host: null, isEmbedded: false };
};

export default function Dashboard() {
  const { shop, host, isEmbedded } = useLoaderData<LoaderData>();
  const [title, setTitle] = useState('');
  const [videoNumber, setVideoNumber] = useState('1');

  const handleSubmit = () => {
    // Example: handle form submission
    console.log('Title:', title);
    console.log('Selected Video URL:', videoNumber);
    // Here you can send data to your backend or API
  };

  const handleTitleChange = (value: string) => setTitle(value);
  const handleVideoChange = (value: string) => setVideoNumber(value);

  const videoOptions = [
    { label: 'Video 1 URL', value: '1' },
    { label: 'Video 2 URL', value: '2' },
    { label: 'Video 3 URL', value: '3' }
  ];

  return (
    <Page title="Video Reels Dashboard">
      <Layout>
        <Layout.Section>
          <Card>
            <TextContainer>
              <h2>Welcome to Video Reels App</h2>
              <p>Connected to: <strong>{shop}</strong></p>
              <p>{isEmbedded ? "Running in Shopify Admin" : "Standalone Mode"}</p>
              <p>Use the form below to add a video to your Shopify app dashboard.</p>
            </TextContainer>
            <Form onSubmit={handleSubmit}>
              <FormLayout>
                <TextField
                  label="Title"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Enter a title"
                  autoComplete="off"
                />
                <Select
                  label="Select Video URL"
                  options={videoOptions}
                  onChange={handleVideoChange}
                  value={videoNumber}
                />
                <Button variant='primary' submit>
                  Submit
                </Button>
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
