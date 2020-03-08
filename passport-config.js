const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

function initialize(passport, getUserByEmail, getUserById) {
	const authenticateUser = async (email, password, done) => {
		const user = getUserByEmail(email);
		if (user == null) {
			return done(null, false, { message: 'No user with that email' });
		}

		try {
			if (await bcrypt.compare(password, user.password)) {
				return done(null, user);
			} else {
				return done(null, false, {
					message: 'Password incorrect. Please try again!'
				});
			}
		} catch (e) {
			return done(e);
		}
	};

	passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));

	passport.serializeUser((user, done) => done(null, user.id));
	passport.deserializeUser((id, done) => {
		return done(null, getUserById(id));
	});
}

function chkEmail(passport, getUserByEmail, getUserById) {
	const authenticateUser = async (email, password, done) => {
		const user = getUserByEmail(email);
		if (user) {
			return done(null, false, { message: 'Email has been taken!' });
		}

		try {
			if (password == password2) {
				return done(null, user);
			} else {
				return done(null, false, {
					message: 'Passwords do not match. Please try again'
				});
			}
		} catch (e) {
			return done(e);
		}
	};

	passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));

	passport.serializeUser((user, done) => done(null, user.id));
	passport.deserializeUser((id, done) => {
		return done(null, getUserById(id));
	});
}

module.exports = { initialize, chkEmail };
