document.getElementById('contactForm').addEventListener('submit', onSubmit);

function onSubmit(e) {
	e.preventDefault();

	grecaptcha
		.execute('6Lcn4d4UAAAAANBX_1T66cTXjsTLbxEnJA4kK4tQ', { action: 'homepage' })
		.then(function(token) {
			// This data is not being used in the back end (Only the token), but have it here for you to experiment
			const firstname = document.querySelector('#FirstnameID').value;
			const lastname = document.querySelector('#LastnameID').value;
			const email = document.querySelector('#EmailID').value;
			const message = document.querySelector('#MessageID').value;
			const captcha = token;

			fetch('/verifyCap', {
				method: 'POST',
				headers: {
					Accept: 'application/json, text/plain, */*',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					firstname: firstname,
					lastname: lastname,
					email: email,
					message: message,
					captcha: captcha
				})
			})
				.then(res => res.text())
				.then(data => {
					console.log(data);
				});

			fetch('/contact', {
				method: 'POST',
				body: JSON.stringify({
					firstname: firstname,
					lastname: lastname,
					email: email,
					message: message,
					captcha: captcha
				})
			});
		});
}
