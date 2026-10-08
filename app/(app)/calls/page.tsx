import { Suspense } from "react";
import { CallsWorkspace } from "@/components/calls/CallsWorkspace";
import { AppLoadingFallback } from "@/components/shared/AppLoadingFallback";

export default function CallsPage() {
  return (
    <Suspense fallback={<AppLoadingFallback />}>
      <CallsWorkspace />
    </Suspense>
  );
}
