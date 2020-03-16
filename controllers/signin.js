const handleSignIn = (req, res ,db, bcrypt) => {

	const { email, password } = req.body;

	if(!email || !password) {
		return res.status(400).json('incorrect form submussion');	
	}

	db('login').select('email', 'hash')
	.where('email', '=', email)
	.then(data => {
		const isValid = bcrypt.compareSync(password, data[0].hash);
		if(isValid){
			return db('users').select('*')
				.where('email','=',email)
				.then(user => {
					res.json(user[0])
				})
				.catch(err => res.status(400).json('unable to find user'))
		}
		else{
			res.status(400).json('wrong credentials')
		}
	})
	.catch(err => res.status(400).json('wrong credentials'))
}

module.exports = {
	handleSignIn : handleSignIn
}