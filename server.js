const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');

const db = require('knex')({
	client : 'pg',
	connection : {
		connectionString : process.env.DATABASE_URL,
		ssl : true
	}
});

// const db = require('knex')({
// 	client : 'pg',
// 	connection : {
// 		host : '127.0.0.1',
// 		user : 'postgres',
// 		password : '9266',
// 		database : 'howdy'
// 	}
// });

const register = require('./controllers/register');
const signIn = require('./controllers/signin');
const profile = require('./controllers/profile');
const chat = require('./controllers/chat');
const contact = require('./controllers/contact');
const message = require('./controllers/message');
const presence = require('./controllers/presence');

const app = express();
app.use(express.json());
app.use(cors());

// Public Folder
app.use(express.static('./public'));

const server = app.listen(process.env.PORT || 3001, () => {
	console.log('Server running');
});

//Socket logic follows
//Connected socket list
let users = [];

const io = require('socket.io')(server);

io.on('connection', (socket) => {

	socket.on('client-joined', (userID) => {
		console.log(`Client user id: ${userID} joined`)
		users[userID] = socket.id;

		//For subscription to user updates
		socket.on('subscribe', (data) => {
			console.log(`Client ${userID} has joined room ${data.room}`)
			socket.join(data.room)
		})
		socket.on('unsubscribe', (data) => {
			console.log(`Client ${userID} left room ${data.room}`)
			socket.leave(data.room)
		})

		//Broadcast client is online to subscribers of this client
		socket.to(userID).emit('client-online', {status : true});
		
		//Store last_online : null in db
		presence.updateLastOnline(null, userID, db);

	});

	socket.on('disconnect', () => {
		let userID = users.indexOf(socket.id);
		console.log(`Client user id: ${userID} left`)
		delete users[userID];

		//Store last_online : currentTime in db
		let currentTime = (new Date()).toISOString();
		presence.updateLastOnline(currentTime, userID, db);

		//Broadcast client is offline to subscribers of this client
		socket.to(userID).emit('client-online', {status : false , last_online : currentTime});

	});

});

app.get('/', (req, res) => {
	res.json('Welcome');
})

app.post('/signin', (req, res) => {signIn.handleSignIn(req, res ,db, bcrypt)})

app.post('/register', (req, res) => {register.handleRegister(req, res ,db, bcrypt)})

//Messages

//To post a message to a chat
app.post('/chats/:chatID/messages', (req, res) => {
	message.createMessage(req, res, db, users, io);
})

//To get the messages from a chat
app.get('/:userID/chats/:chatID/messages', (req, res) => {
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

//Get contact by ID
app.get('/:userID/contacts/:contactID', (req, res) => {
	contact.getContact(req, res, db);
})

//Get contacts of authorised user
app.get('/:userID/contacts', (req, res) => {
	contact.getContacts(req, res, db);
})

//Create contact
app.post('/:userID/contacts', (req, res) => {
	contact.createContact(req, res, db);
})

//Update contact
app.put('/:userID/contacts', (req, res) => {
	contact.updateContact(req, res, db);
})

//Profile

//Get full Profile Info - deprecate if not used in app
app.get('/:userID/profile', (req, res) => {profile.handleProfileGet(req, res, db)})

//Get Profile Pic
app.get('/:userID/profile/photo', (req, res) => {
	profile.getPhoto(req, res, db);
})

//Upload Profile Pic
app.post('/:userID/profile/photo', (req, res) => {
	// profile.uploadLocal(req, res, db, io);
	profile.uploadToCloud(req, res, db, io);
})

//Get User Name
app.get('/:userID/profile/name', (req, res) => {
	profile.getName(req, res, db);
})

//Upload User Name
app.post('/:userID/profile/name', (req, res) => {
	profile.setName(req, res, db);
})

//Presence

//Last online
app.get('/:userID/last-online', (req, res) => {
	presence.getLastOnline(req, res, db);
})

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