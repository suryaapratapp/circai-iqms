import { TransactionHistory } from "@/components/transactions/transaction-history";
import { getRepository } from "@/lib/data";
import { requireSession } from "@/lib/auth/session";

export default async function TransactionHistoryPage() {
  const session = await requireSession();
  const transactions = await getRepository().listTransactions(session);
  return <TransactionHistory transactions={transactions} />;
}
