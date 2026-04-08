import { SearchModule } from "@/components/workflows/search-module";
import { getCachedWorkflowLookups } from "@/lib/data/server";

export default async function SearchPage() {
  const lookups = await getCachedWorkflowLookups("move");
  return <SearchModule lookups={lookups} />;
}
