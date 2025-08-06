import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { ReactElement } from "react";
import { NextPage } from "next";

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactElement;
};

export function withDashboardLayout(
  PageComponent: NextPage
): NextPageWithLayout {
  const Page = PageComponent as NextPageWithLayout;

  Page.getLayout = (page: ReactElement) => (
    <ProtectedRoute>
      <DashboardLayout>{page}</DashboardLayout>
    </ProtectedRoute>
  );

  return Page;
}
