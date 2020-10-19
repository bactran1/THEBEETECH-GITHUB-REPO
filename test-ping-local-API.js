const express = require('express');
const app = express();
require('dotenv/config');
const fetch = require('node-fetch');
var Request = require('request');
var request1 = require('request-promise');
var request2 = require('request-promise');
const intervalP = require('interval-promise');

const port = process.env.PORT || 5000;

//JSON parser
var bodyParser = require('body-parser');
//Use JSON
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json()); // support json encoded bodies

app.get('/', (req, res) => {
	//res.send('<h1>Test Hue API</h1><br><h2>AUTHOR: Bac Tran</h2>');
	var i = 1,
		max = 5;

	//set the appropriate HTTP header
	res.setHeader('Content-Type', 'text/html');

	//send multiple responses to the client
	for (; i <= max; i++) {
		res.write('<h1>This is the response #: ' + i + '</h1>');
	}

	res.end();
});

const options1 = {
	method: 'PUT',
	uri:
		'http://192.168.50.149/api/UcyeQMQeFROEPHYkggUP-shfrHrCzioLnkT7cDGJ/lights/7/state',
	body: {
		on: true
	},
	json: true,
	headers: {
		'Content-Type': 'application/json',
		Authorization: 'bwejjr33333333333'
	}
};
const options2 = {
	method: 'PUT',
	uri:
		'http://192.168.50.149/api/UcyeQMQeFROEPHYkggUP-shfrHrCzioLnkT7cDGJ/lights/7/state',
	body: {
		on: false
	},
	json: true,
	headers: {
		'Content-Type': 'application/json',
		Authorization: 'bwejjr33333333333'
	}
};

const options3 = {
	method: 'GET',
	uri:
		'http://192.168.50.149/api/UcyeQMQeFROEPHYkggUP-shfrHrCzioLnkT7cDGJ/lights/7/',

	json: true,
	headers: {
		'Content-Type': 'application/json',
		Authorization: 'bwejjr33333333333'
	}
};

app.get('/hueOn', (req, res) => {
	request1(options1)
		.then(function(response) {
			res.status(200).json(response);
			console.log(response);
		})
		.catch(function(err) {
			console.log(err);
		});
	console.log(typeof request);
});

app.get('/hueOff', (req, res) => {
	request2(options2)
		.then(response => {
			return res.json(response), console.log(response);
		})
		.catch(function(err) {
			console.log(err);
		});
});

app.get('/hueStat', (req, res) => {
	request2(options3)
		.then(response => {
			return res.json(response.state), console.log(response.state.on);
		})
		.catch(function(err) {
			console.log(err);
		});
});

app.get('/hueAlt', async (req, res) => {
	res.setHeader('Content-Type', 'application/json');

	function off() {
		request2(options2)
			.then(response => {
				return res.write(JSON.stringify(response)), console.log(response);
			})
			.catch(function(err) {
				console.log(err);
			});
	}

	function on() {
		request1(options1)
			.then(response => {
				return res.write(JSON.stringify(response)), console.log(response);
			})
			.catch(function(err) {
				console.log(err);
			});
	}

	function chkStat() {
		request1(options3)
			.then(response => {
				if (response.state.on == false) {
					return (
						res.write(JSON.stringify(response.state)),
						console.log(response.state),
						intervalP(
							async () => {
								await on();
							},
							3000,
							{ iterations: 1 }
						)
					);
				} else if (response.state.on == true) {
					return (
						res.write(JSON.stringify(response.state)),
						console.log(response.state),
						intervalP(
							async () => {
								await off();
							},
							3000,
							{ iterations: 1 }
						)
					);
				}
			})
			.catch(function(err) {
				console.log(err);
			});
	}
	await setInterval(chkStat, 1000);
});
app.listen(port, () => {
	console.log(`Server started on port ${port}`);
});
