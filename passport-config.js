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
				done(null, false, { message: 'Password incorrect' });
				console.log(user.email);
				console.log(password);
				console.log(user.password);
				bcrypt.compare(password, user.password, (err, result) => {
					console.log(err);
					console.log(result);
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

module.exports = initialize;
