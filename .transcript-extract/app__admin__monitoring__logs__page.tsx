import { Suspense } from "react";
import LogsPage from "./logsPageClient";
import { LoadingBlock } from "@/app/admin/_components/adminUi";

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <LogsPage />
    </Suspense>
  );
}
