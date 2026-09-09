"use client";

import { ViewError } from "@/components/ui/view-error";

export default function WrappedError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ViewError reset={reset} />;
}
