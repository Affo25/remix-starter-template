import { useState } from 'react';
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

export default function Dashboard() {
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
    <Page title="Dashboard">
      <Layout>
        <Layout.Section>
          <Card>
            <TextContainer>
              <h2>Upload or Select a Video</h2>
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
