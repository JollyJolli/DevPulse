"use client";

import { ViewError } from "@/components/ui/view-error";

export default function YearComparisonError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ViewError reset={reset} />;
}
