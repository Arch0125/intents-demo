import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import "@fontsource/ubuntu-mono";
import "@fontsource/dm-mono";
import Script from "next/script";
import { useEffect } from "react";
import mixpanel from "mixpanel-browser";
import "@biconomy/web3-auth/dist/src/style.css";
import { SmartAccountProvider } from "../contexts/SCWContext";
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// const queryClient = new QueryClient()

const App: React.FC<AppProps> = ({ Component, pageProps }) => {
  useEffect(() => {
    mixpanel.init("7c777fe9916e0c5f40a2d013a66812dd", {
      debug: true,
      track_pageview: true,
      persistence: "localStorage",
    });
  }, []);

  return (
    <ChakraProvider>
      <SmartAccountProvider>
        {/* <QueryClientProvider client={queryClient}> */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MM9X78MTQF"
          strategy="afterInteractive"
        />
        <Script>
          {`
						window.dataLayer = window.dataLayer || [];
  						function gtag(){dataLayer.push(arguments);}
  						gtag('js', new Date());

  						gtag('config', 'G-MM9X78MTQF');
					`}
        </Script>
        <Component {...pageProps} />
        {/* </QueryClientProvider> */}
      </SmartAccountProvider>
    </ChakraProvider>
  );
};

export default App;
