const { Pool, Client } = require('pg');
const connectionString =
	'postgres://shhqifqiwptymj:8c0542db9c235d77f01d2ef4b039a85a3b39250ec63ad58d8a812977177ca1a4@ec2-18-213-176-229.compute-1.amazonaws.com:5432/d5927fp2ila6a3';

const pool = new Pool({
	connectionString: connectionString,
	max: 10, // max number of connection can be open to database
	idleTimeoutMillis: 30000,
	ssl: true,
	rejectUnauthorized: true
});
pool.query('SELECT * FROM testingDB', (err, res) => {
	console.log(err);
	console.log(res.rows[0].name);
	pool.end();
});
// const client = new Client({
// 	connectionString: connectionString
// });
// client.connect();
// client.query('SELECT NOW()', (err, res) => {
// 	console.log(err, res);
// 	client.end();
// });
