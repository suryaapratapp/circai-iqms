import { TransactionHistory } from "@/components/transactions/transaction-history";
import { getRepository } from "@/lib/data";
import { getCachedSession } from "@/lib/data/server";

export default async function TransactionHistoryPage() {
  const session = await getCachedSession();
  const transactions = await getRepository().listTransactions(session, { limit: 200 });
  return <TransactionHistory transactions={transactions} />;
}
