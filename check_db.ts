
import { db } from "./server/db";
import { invoices } from "./shared/schema";
import { desc } from "drizzle-orm";

async function checkLatestInvoice() {
    try {
        const result = await db.select().from(invoices).orderBy(desc(invoices.id)).limit(5);
        console.log("Latest 5 invoices:");
        result.forEach(inv => {
            console.log(`ID: ${inv.id}, Customer: ${inv.customerName}`);
            console.log("Metadata:", JSON.stringify(inv.metadata, null, 2));
            console.log("Expenses:", JSON.stringify(inv.expenses, null, 2));
            console.log("-----------------------------------");
        });
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkLatestInvoice();
