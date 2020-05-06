
const handleRegister = (req, res ,db, bcrypt) => {
	let {email, name, password, confirmPassword} = req.body;

	let valid = false;

	console.log(email, name, password, confirmPassword);

	if(email && name && password && confirmPassword)
	{
		email = email.trim();
		name = name.trim();
		password = password.trim();
		confirmPassword = confirmPassword.trim();

		if(email.length && name.length)
		{
			if(password === confirmPassword)
				valid = true;
		}

	}

	if(!valid) {
		return res.status(400).json('incorrect form submission');	
	}

	const hash = bcrypt.hashSync(password, 10);
	db.transaction(trx => {
		trx.insert({
			hash: hash,
			email: email
		})
		.into('login')
		.returning('email')
		.then( loginEmail => {
			return trx('users')
			.returning('*')
			.insert({
				email: loginEmail[0],
				name: name
			})
			.then(user => {
				res.json(user[0]);
			})
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})
	.catch(err => res.status(400).json('unable to register'))
}

module.exports = {
	handleRegister : handleRegister
}