
import { db } from "./server/db";
import { invoices } from "./shared/schema";
import { desc } from "drizzle-orm";

async function checkLatestInvoice() {
    try {
        const latest = await db.select().from(invoices).orderBy(desc(invoices.id)).limit(1);
        if (latest.length > 0) {
            console.log("Latest Invoice Metadata:");
            console.log(JSON.stringify(latest[0].metadata, null, 2));
        } else {
            console.log("No invoices found.");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkLatestInvoice();
