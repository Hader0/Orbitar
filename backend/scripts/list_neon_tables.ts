import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  try {
    const rows = await (prisma as any).$queryRawUnsafe(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log("tables_in_public_schema:");
    for (const r of rows) {
      console.log(r.table_name || r.table_name);
    }
  } catch (err) {
    console.error("Failed to list tables:", err);
    process.exitCode = 1;
  } finally {
    try {
      await prisma.$disconnect();
    } catch {}
  }
}

main();
