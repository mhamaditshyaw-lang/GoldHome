
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://hama:Hama10Kurd--@localhost:5432/goldhome',
});

async function run() {
    try {
        await client.connect();
        const res = await client.query('SELECT id, metadata, expenses FROM invoices ORDER BY id DESC LIMIT 1');
        if (res.rows.length > 0) {
            console.log('Latest Invoice ID:', res.rows[0].id);
            console.log('Metadata:', JSON.stringify(res.rows[0].metadata, null, 2));
            console.log('Expenses:', JSON.stringify(res.rows[0].expenses, null, 2));
        } else {
            console.log('No invoices found');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
