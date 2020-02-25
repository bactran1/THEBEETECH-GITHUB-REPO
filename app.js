const express = require('express');
//Set View Engine for EJS
const app = express();

const mysql = require('mysql');
var path = require('path');
require('dotenv/config');
const readline = require('readline');
const Joi = require('joi');
const ejs = require('ejs');
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');

const initializePassport = require('./passport-config');
// initializePassport(
// 	passport,
// 	email => users.find(user => user.email === email),
// 	id => users.find(user => user.id === id)
// );

//Set View Engine for EJS
app.set('view-engine', 'ejs');
//Create Prompt from user input
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

//Connect to DB
//Local ID,PASS
var users = [];

var connection1 = mysql.createPool({
	connectionLimit: 100,
	multipleStatements: true,
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_DB
});

var connection3 = mysql.createPool({
	connectionLimit: 100,
	multipleStatements: true,
	host: process.env.DB_HOST2,
	user: process.env.DB_USER2,
	password: process.env.DB_PASS2,
	database: process.env.DB_DB2
});

var connection2 = mysql.createPool({
	connectionLimit: 100,
	multipleStatements: true,
	host: 'localhost',
	user: 'root',
	database: 'testbac'
});

var connection = connection3;

connection.getConnection(function(error, tempCont) {
	if (!!error) {
		tempCont.release();
		console.log('Error');
		return;
	} else {
		console.log('Connected to DB');
		tempCont.query('SELECT * FROM testingDB', function(error, rows, fields) {
			tempCont.release();
			if (!!error) {
				console.log(error);
			} else {
				users = JSON.parse(JSON.stringify(rows));
				console.log(users);
				console.log('Successful query: Retrieve Entire DB');
				initializePassport(
					passport,
					email => users.find(user => user.email === email),
					id => users.find(user => user.id === id)
				);
			}
		});
	}
});

//TESTING APP LOGIN

//Middlewares
//JSON parser
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
//Use JSON
app.use(express.urlencoded({ extended: false }));

//include views folder
app.use(express.static(__dirname + '/views'));

app.use(flash());
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false
	})
);

app.use(passport.initialize());
app.use(passport.session());

app.use(methodOverride('_method'));
//--------END MIDDLEWARES-------------------------------------------------//
//ROUTES
//MAIN page
app.get('/', (req, res) => {
	//	res.sendFile("index.html", { root: path.join(__dirname, "/public") });
	res.render('index.ejs');
});

//Make Heroku app awake using cron-job.org
app.get('/cron', (req, res) => {
	//	res.sendFile("index.html", { root: path.join(__dirname, "/public") });
	res.send('cron haha');
});

//View LOGIN page to LOGIN
app.get('/login', checkNotAuth, (req, res) => {
	res.render('login.ejs');
});

//View USER page when LOGGED IN
app.get('/user', checkAuth, (req, res) => {
	res.render('user.ejs', { name: req.user.name });
});

//Prompt USER to LOGIN
app.post(
	'/login',
	checkNotAuth,
	passport.authenticate('local', {
		successRedirect: '/user',
		failureRedirect: '/login',
		failureFlash: true,
		badRequestMessage: 'Testing bad request'
	})
);

//Prompt USER to REGISTER
app.get('/register', checkNotAuth, (req, res) => {
	res.render('register.ejs');
});

app.post('/register', checkNotAuth, async (req, res) => {
	try {
		const hashedPW = await bcrypt.hash(req.body.password, 10);

		//REPLACE by DATABASE PUSH SYNXTAX
		// users.push({
		// 	id: Date.now().toString(),
		// 	name: `${req.body.firstname} ${req.body.lastname}`,
		// 	email: req.body.email,
		// 	password: hashedPW
		// });

		connection.getConnection(function(error, tempCont) {
			if (!!error) {
				tempCont.release();
				console.log('Error');
			} else {
				console.log('Connected to DB');
				let id = Date.now().toString();
				let name = `${req.body.firstname} ${req.body.lastname}`;
				let email = req.body.email;
				let password = hashedPW;

				let post = { id: id, name: name, email: email, password: password };
				let sql = `INSERT INTO testingDB SET ?`;

				tempCont.query(sql, post, (error, rows, fields) => {
					//tempCont.release();
					if (!!error) {
						console.log(error);
					} else {
						console.log(
							`Item with ID: ${id}, Name: ${name}, Email: ${email} and PW: ${password} added to table testingDB`
						);
					}
				});

				tempCont.query('SELECT * FROM testingDB', function(
					error,
					rows,
					fields
				) {
					tempCont.release();
					if (!!error) {
						console.log(error);
					} else {
						users = JSON.parse(JSON.stringify(rows));
						console.log(users);
						console.log('Successful query: Retrieve Entire DB');
						initializePassport(
							passport,
							email => users.find(user => user.email === email),
							id => users.find(user => user.id === id)
						);
					}
				});
			}
		});

		//-----------------------------------------//
		res.redirect('/success');
	} catch {
		res.redirect('/register');
	}

	console.log(users);
});

app.delete('/logout', (req, res) => {
	//RETRIEVE user data from DB is user deleted their account
	connection.getConnection(function(error, tempCont) {
		if (!!error) {
			tempCont.release();
			console.log('Error');
			return;
		} else {
			console.log('Re-retrieved data from DB');
			tempCont.query('SELECT * FROM testingDB', function(error, rows, fields) {
				tempCont.release();
				if (!!error) {
					console.log(error);
				} else {
					users = JSON.parse(JSON.stringify(rows));
					console.log(users);
					console.log('Successful query: Retrieve Entire DB');
					initializePassport(
						passport,
						email => users.find(user => user.email === email),
						id => users.find(user => user.id === id)
					);
				}
			});
		}
	});
	req.logOut();
	res.redirect('/login');
});

//Check User's Authentication
function checkAuth(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}

	res.redirect('/login');
}

function checkNotAuth(req, res, next) {
	if (req.isAuthenticated()) {
		return res.redirect('/');
	}
	next();
}

//Prompt USER to SUCCESS PAGE
app.get('/success', (req, res) => {
	res.render('success.ejs');
});

//Prompt USER to CONTACT PAGE
app.get('/contact', (req, res) => {
	res.render('contact.ejs');
});
//------END AUTHENTICATION--------------------------------------------------------//

//Create Table
app.get('/createDB', (req, res) => {
	//Prompt and read user's input wrapper
	rl.question('Please choose a name for your new database: ', newdb => {
		console.log(`Your new Database name is: ${newdb}`);

		let sql = `CREATE DATABASE ${newdb}`;
		connection.query(sql, (err, result) => {
			if (err) {
				console.log(err);
			}
			console.log(result);
			res.send(`Database name ${newDB} created...`);
		});
		rl.close;
	});
});

//Create table
app.get('/createPostTable/:TbName', (req, res) => {
	let sql = `CREATE TABLE ${req.params.TbName}(id int AUTO_INCREMENT, name VARCHAR(255), email VARCHAR(255), password VARCHAR PRIMARY KEY(id))`;
	connection.query(sql, (err, result) => {
		if (!!err) {
			console.log(err);
		}
		console.log(result);
		res.send('Posts table created...');
	});
});

//Insert Row to table
app.get('/addpost/:id/:name', (req, res) => {
	connection.getConnection(function(error, tempCont) {
		if (!!error) {
			tempCont.release();
			console.log('Error');
		} else {
			console.log('Connected');
			let id = req.params.id;
			let Name = req.params.name;
			let post = { ID: id, Name: Name };
			let sql = `INSERT INTO testingDB SET ?`;
			tempCont.query(sql, post, (error, rows, fields) => {
				tempCont.release();
				if (!!error) {
					console.log(error);
				} else {
					console.log(
						`Item with ID: ${req.params.id} and Name: ${req.params.name} added to table testingDB`
					);
					res.send(
						`Item with ID: ${req.params.id} and Name: ${req.params.name} added to table testingDB`
					);
				}
			});
		}
	});
});

//SELECT and SHOWS posts
app.get('/db', (req, res) => {
	connection.getConnection(function(error, tempCont) {
		if (!!error) {
			tempCont.release();
			console.log('Error');
			return;
		} else {
			console.log('Connected');
			tempCont.query('SELECT * FROM testingDB', function(error, rows, fields) {
				tempCont.release();
				if (!!error) {
					console.log(error);
				} else {
					res.send(rows);
					console.log(
						`Successful query: Retrieve Entire table testingDB in testbac DB`
					);
				}
			});
		}
	});
});

//SELECT single post
app.get('/getpost/:id', (req, res) => {
	connection.getConnection(function(error, tempCont) {
		if (!!error) {
			tempCont.release();
			console.log('Error');
		} else {
			console.log('Connected');
			let sql = `SELECT * FROM testingDB WHERE id = ${req.params.id}`;
			tempCont.query(sql, (error, rows, fields) => {
				tempCont.release();
				if (!!error) {
					console.log(error);
				} else {
					console.log(`Single Post with ID ${req.params.id} fetched!!`);
					res.send(rows);
					console.log(rows[0]);
				}
			});
		}
	});
});

//UPDATE post Name
app.get('/updatePost/:id/:attr/:newName', (req, res) => {
	connection.getConnection(function(error, tempCont) {
		if (!!error) {
			tempCont.release();
			console.log('Error');
		} else {
			console.log('Connected');
			let newName = req.params.newName;
			let attr = req.params.attr;
			let sql = `UPDATE testingDB SET ${attr} = '${newName}' WHERE id = ${req.params.id}`;
			tempCont.query(sql, (error, rows) => {
				tempCont.release();
				if (!!error) {
					console.log(error);
				} else {
					console.log(
						`Title in ID ${req.params.id} with attribute ${attr} updated to ${newName}`
					);
					res.send(
						`Title in ID ${req.params.id} with attribute ${attr} updated to ${newName}`
					);
				}
			});
		}
	});
});
//ADD more column to existing table
app.get('/addColumn/:colName', (req, res) => {
	connection.getConnection(function(error, tempCont) {
		if (!!error) {
			tempCont.release();
			console.log('Error');
		} else {
			console.log('Connected');
			let newColumn = req.params.colName;
			let sql = `ALTER TABLE testingDB ADD COLUMN ${newColumn} VARCHAR(255)`;
			tempCont.query(sql, (error, rows) => {
				tempCont.release();
				if (!!error) {
					console.log(error);
				} else {
					res.send(`Column name ${newColumn} added`);
				}
			});
		}
	});
});

//DELETE COLUMN using DROP column to existing table
app.get('/delColumn/:colName', (req, res) => {
	connection.getConnection(function(error, tempCont) {
		if (!!error) {
			tempCont.release();
			console.log('Error');
		} else {
			console.log('Connected');
			let colName = req.params.colName;
			let sql = `ALTER TABLE testingDB DROP COLUMN ${colName}`;
			tempCont.query(sql, (error, rows) => {
				tempCont.release();
				if (!!error) {
					console.log(error);
				} else {
					res.send(`Column name ${colName} dropped!`);
				}
			});
		}
	});
});

//DELETE post
app.get('/deletePost/:id', (req, res) => {
	connection.getConnection(function(error, tempCont) {
		if (!!error) {
			tempCont.release();
			console.log('Error');
		} else {
			console.log('Connected');
			let delID = req.params.id;
			let sql = `DELETE FROM testingDB WHERE id = ${delID}`;
			tempCont.query(sql, (error, rows) => {
				tempCont.release();
				if (!!error) {
					console.log(error);
				} else {
					res.send(`Entry with ID ${req.params.id} deleted`);
				}
			});
		}
	});
});

//Read env object
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
