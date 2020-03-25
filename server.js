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

const register = require('./controllers/register');
const signIn = require('./controllers/signin');
const profile = require('./controllers/profile');
const chat = require('./controllers/chat');
const contact = require('./controllers/contact');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
	res.send(database.users);
})

app.post('/signin', (req, res) => {signIn.handleSignIn(req, res ,db, bcrypt)})

app.post('/register', (req, res) => {register.handleRegister(req, res ,db, bcrypt)})

app.get('/profile/:userID', (req, res) => {profile.handleProfileGet(req, res, db)})

//Chats

//Create a new chat 
app.post('/chats', (req, res) => {
	chat.createChat(req, res, db);
})

//Get all chats of a user 
app.get('/:userID/chats', (req, res) => {
	chat.getChats(req, res, db);
})

//Get a chat by its id
app.get('/chats/:chatID', (req, res) => {
	chat.getChat(req, res, db);
})

//Contacts

//Get contacts of authorised user
app.get('/contacts/:userID', (req, res) => {
	contact.getContacts(req, res, db);
})

//Create contact
app.put('/contacts/:userID', (req, res) => {
	contact.createContact(req, res, db);
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

/signin --> POST = success/fail -- DONE
/register --> POST = user -- DONE

/profile/:userId --> GET = user
/chats/:userId --> GET = chats (Only dp and latest message for quick load)

/contactInfo/:contactId --> GET = contact info
/messages/:contactId --> GET = messages

/contacts/:userId --> GET = contacts
/createContact --> POST = contact
*/