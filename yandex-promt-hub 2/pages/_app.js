import React, { useEffect } from "react";
import { useRouter } from "next/router";

import useCalcVh from "hooks/useCalcVh";
import useFoucFix from "hooks/useFoucFix";
import useResponsible from "hooks/useResponsible";
import { useHydrate } from "utils/store";
import { StoreProvider } from "contexts/ZustandProvider";

import "styles/globals.css";
import "styles/colors.css";
import "styles/fonts.css";

import Layout from "components/common/Layout";

function AppContent({ Component, pageProps }) {
  return (
    <>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}

export default function App({ Component, pageProps, router: nextRouter }) {
  // Инициализируем Zustand-стор
  const store = useHydrate(pageProps.cms);

  useFoucFix();
  useResponsible();
  useCalcVh();

  return (
    <StoreProvider store={store}>
      {/* <NotificationPopup /> */}
      <AppContent Component={Component} pageProps={pageProps} />
    </StoreProvider>
  );
}
