import { SearchModule } from "@/components/workflows/search-module";
import { getCachedLookups } from "@/lib/data/server";

export default async function SearchPage() {
  const lookups = await getCachedLookups();
  return <SearchModule lookups={lookups} />;
}
