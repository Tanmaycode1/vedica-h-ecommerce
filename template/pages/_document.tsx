import Document, { Html, Head, Main, NextScript, DocumentContext } from "next/document";

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);

    return initialProps;
  }

  render() {
    return (
      <Html>
        <Head>
          <link rel="shortcut icon" href="/images/favicon/favicon.ico" />
          <link href="https://fonts.googleapis.com/css?family=PT+Sans:400,700&amp;display=swap" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css?family=Raleway&amp;display=swap" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
          <link href="/css/custom-product.css" rel="stylesheet" />
          <link href="/css/landing-page.css" rel="stylesheet" />
          <link href="/css/collection-product.css" rel="stylesheet" />
          <link href="/css/vedich-logo.css" rel="stylesheet" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
