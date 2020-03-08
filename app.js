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
const request = require('request');
//FOR SENDING EMAIL
const nodeMailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');

// create reusable transporter object using the default SMTP transport
let transporter = nodeMailer.createTransport({
	host: process.env.EMAIL_SERVER,
	port: 465,
	secure: true, // true for 465, false for other ports
	dkim: {
		domainName: 'beetech.dev',
		keySelector: 'auth',
		privateKey: process.env.EMAIL_DKIM_KEY
	},
	auth: {
		user: process.env.EMAIL_USER, // generated ethereal user
		pass: process.env.EMAIL_PASS // generated ethereal password
	}
});

//CREATE AUTH
const PassportConf = require('./passport-config');
const initializePassport = PassportConf.initialize;
const chkEmail = PassportConf.chkEmail;

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
//Use JSON
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json()); // support json encoded bodies

//include views folder
app.use(express.static(__dirname + '/views'));

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: true,
		saveUninitialized: false
	})
);
app.use(flash());
//Global Vars
app.use((req, res, next) => {
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	next();
});

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
	res.send('cron successful!!!!!');
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

		connection.getConnection(function(error, tempCont) {
			tempCont.query('SELECT * FROM testingDB', function(error, rows, fields) {
				user = rows.find(user => user.email === req.body.email);
				if (user) {
					tempCont.release();
					console.log('email taken');
					console.log(user);
					req.flash(
						'error_msg',
						'That email has been taken. Please use a different email!'
					);
					res.redirect('/register');
				} else if (req.body.password != req.body.password2) {
					tempCont.release();
					console.log('Passwords do not match');
					console.log(req.body.password, req.body.password2);
					req.flash('error_msg', 'Passwords do not match! Please try again');
					res.redirect('/register');
				} else if (!!error) {
					console.log(error);
					tempCont.release();
					req.flash('error_msg', 'Failed to connect to server');
					res.redirect('/register');
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
							//SEND CONFIRMATION EMAIL AFTER REGISTRATION
							transporter.use(
								'compile',
								hbs({
									viewEngine: {
										extName: '.handlebars',
										partialsDir: './views/email-views/',
										layoutsDir: './views/email-views/',
										defaultLayout: 'success-registration'
									},
									viewPath: './views/email-views/'
								})
							);

							let mailOption = {
								from: 'BEE TECHNOLOGIES 🐝  <customersupport@beetech.dev>', // sender address
								to: email, // list of receivers
								subject: `Welcome to your new BeeTech Account ✔`, // Subject line
								template: 'success-registration',
								context: {
									username: name,
									email: email,
									password: req.body.password
								}
							};

							transporter.sendMail(mailOption, (err, data) => {
								if (err) {
									console.log('Error occurs');
									console.log(err);
								}
								console.log('Email sent!!!');
								console.log(data);
							});
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
					req.flash('success_msg', 'Sign up completed. You can now log in');
					res.redirect('/success-register');
				}
			});
		});
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
app.get('/success-register', (req, res) => {
	res.render('success-register.ejs');
});

app.get('/success-contact', (req, res) => {
	res.render('success-contact.ejs');
});

//Prompt USER to CONTACT PAGE
app.get('/contact', (req, res) => {
	//res.render('contact.ejs');
	res.render('contact.ejs');
});

app.post('/contact', (req, res) => {
	//EMAIL TO CUSTOMER SERVICE REP
	function mailToServer(req, res) {
		var message = JSON.stringify(req.body);
		let mailOption = {
			from: 'BEE TECHNOLOGIES 🐝  <customersupport@beetech.dev>', // sender address
			to: 'customersupport@beetech.dev', // list of receivers
			subject: `[CONTACT BEETECH] New contact inquiry from ${req.body.email}, Subject: ${req.body.subject}`, // Subject line
			text: message
		};

		transporter.sendMail(mailOption, (err, data) => {
			if (err) {
				console.log('Error occurs REP');
				console.log(err);
			} else {
				console.log('Email sent!!! REP');
				console.log(data);
			}
		});
	}
	mailToServer(req, res);
	//CONFIRMATION EMAIL TO CUSTOMER/SENDER
	function mailToCustom(req, res) {
		transporter.use(
			'compile',
			hbs({
				viewEngine: {
					extName: '.handlebars',
					partialsDir: './views/email-views/',
					layoutsDir: './views/email-views/',
					defaultLayout: 'contact-message'
				},
				viewPath: './views/email-views/'
			})
		);

		let mailOption1 = {
			from: 'BEE TECHNOLOGIES 🐝  <customersupport@beetech.dev>', // sender address
			to: req.body.email, // list of receivers
			subject: `Thank you for contacting us ✔`, // Subject line
			template: 'contact-message',
			context: {
				username: `${req.body.firstname} ${req.body.lastname}`,
				email: req.body.email,
				message: req.body.message
			}
		};

		transporter.sendMail(mailOption1, (err, data) => {
			if (err) {
				console.log('Error occurs CUS');
				console.log(err);
			}
			console.log('Email sent!!! CUS');
			console.log(data);
		});
		req.flash('success_msg', 'Message sent successfully. Going to Homepage...');
		res.redirect('/success-contact');
	}
	mailToCustom(req, res);
	//REDIRECT
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
