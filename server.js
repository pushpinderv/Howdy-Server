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
const message = require('./controllers/message');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
	res.send(database.users);
})

app.post('/signin', (req, res) => {signIn.handleSignIn(req, res ,db, bcrypt)})

app.post('/register', (req, res) => {register.handleRegister(req, res ,db, bcrypt)})

app.get('/profile/:userID', (req, res) => {profile.handleProfileGet(req, res, db)})

//Messages

//To post a message to a chat
app.post('/chats/:chatID/messages', (req, res) => {
	message.createMessage(req, res, db);
})

//To get the messages from a chat
app.get('/chats/:chatID/messages', (req, res) => {
	message.getMessages(req, res, db);
})

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
app.get('/:userID/chats/:chatID', (req, res) => {
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