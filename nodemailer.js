const nodeMailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
require('dotenv/config');

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
	to: 'phongkiembac@gmail.com', // list of receivers
	subject: `It's Bee Tech ✔`, // Subject line
	template: 'success-registration',
	context: {
		username: 'Bac'
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
