import { Page, Card, TextContainer, Layout } from '@shopify/polaris';

export default function Dashboard() {
  return (
    <Page title="Dashboard">
      <Layout>
        <Layout.Section>
          <Card>
            <TextContainer>
              <h2>Welcome to your Shopify App Dashboard!</h2>
              <p>
                This page uses Shopify Polaris for a native admin look and feel.
              </p>
            </TextContainer>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
