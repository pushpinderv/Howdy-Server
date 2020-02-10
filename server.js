const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const db = require('knex')({
	client : 'pg',
	connection : {
		host : '127.0.0.1',
		user : 'postgres',
		password : '9266',
		database : 'howdy'
	}
});

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
	res.send(database.users);
})

app.post('/signin', (req, res) => {

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
})

app.post('/register', (req, res) => {
	const {email, name, password, confirmPassword} = req.body;

	if(!email || !name || !password) {
		return res.status(400).json('incorrect form submussion');	
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
})

app.get('/profile/:userId', (req, res) => {

	const { userId } = req.params;

	db.select('*').from('users').where({
		id: userId
	})
	.then(user => {
		if(user.length){
		res.json(user[0])
	}
		else{
		res.status(400).json('Not found');	
		}
	})
	.catch(err => res.status(400).json('Error getting user'));	
})

//For updating data
// app.put('/image' , (req, res) => {
// 	const { id } = req.body;
// 	db('users').where('id', '=', id)
// 	.increment('entries', 1)
// 	.returning('entries')
// 	.then(entries => {
// 		res.json(entries[0]);
// 	})
//  .catch(err => res.status(400).json('Failed'))
// })

// bcrypt.hash()

app.listen(3001, () => {
	console.log('Server running');
});

/*

/ --> root

/signin --> POST = success/fail
/register --> POST = user

/profile/:userId --> GET = user
/chats/:userId --> GET = chats (Only dp and latest message for quick load)

/contactInfo/:contactId --> GET = contact info
/messages/:contactId --> GET = messages

/contacts/:userId --> GET = contacts
/createContact --> POST = contact
*/