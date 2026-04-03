import { promises as fs } from "fs";
import path from "path";
import { createSeedDatabase } from "@/lib/data/seed";
import type { DatabaseShape } from "@/lib/data/types";

const dataDirectory = path.join(process.cwd(), ".data");
const databaseFile = path.join(dataDirectory, "iqms-demo-db.json");

async function ensureDatabaseFile() {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(databaseFile);
  } catch {
    await fs.writeFile(databaseFile, JSON.stringify(createSeedDatabase(), null, 2));
  }
}

export async function readDatabase(): Promise<DatabaseShape> {
  await ensureDatabaseFile();
  const content = await fs.readFile(databaseFile, "utf8");
  const parsed = JSON.parse(content) as Partial<DatabaseShape>;
  if (
    parsed.schemaVersion !== 4 ||
    !Array.isArray(parsed.roles) ||
    !Array.isArray(parsed.receipts) ||
    !Array.isArray(parsed.packingOrders)
  ) {
    const fresh = createSeedDatabase();
    await writeDatabase(fresh);
    return fresh;
  }
  return parsed as DatabaseShape;
}

export async function writeDatabase(database: DatabaseShape) {
  await ensureDatabaseFile();
  await fs.writeFile(databaseFile, JSON.stringify(database, null, 2));
}
