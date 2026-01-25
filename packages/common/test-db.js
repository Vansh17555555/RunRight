const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://runright:runright@localhost:5432/runright'
});

async function connect() {
  try {
    await client.connect();
    console.log('Connected successfully');
    const res = await client.query('SELECT $1::text as message', ['Hello world!']);
    console.log(res.rows[0].message);
    await client.end();
  } catch (err) {
    console.error('Connection error', err);
  }
}

connect();
