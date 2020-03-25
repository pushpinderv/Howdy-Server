const getChats = (req , res, db) => {
	
	const {userID} = req.params;
 
	let query = `
		SELECT
			chats.id AS chat_id,
			auth_user.messages_read_at < messages.created_at AS has_unread_messages,
			messages.id AS message_id,
			messages.content AS message,
			messages.created_at AS time_stamp,
			messages.user_id = ${userID} AS mine,
			other_users.id AS participant_id,
			other_users.name AS name,
			other_users.email AS email,
			other_users.photo_url AS photo_url
		FROM chats
		INNER JOIN messages ON chats.last_message_id = messages.id
		INNER JOIN participants other_participants
			ON other_participants.chat_id = chats.id
				AND other_participants.user_id != ${userID}
		INNER JOIN users other_users ON other_participants.user_id = other_users.id
		INNER JOIN participants auth_user
			ON auth_user.chat_id = chats.id
				AND auth_user.user_id = ${userID}`

		let before = '';
		if(req.query.before)
			before = req.query.before.trim(); 
		if (before !== "") {
		query += ` WHERE chats.id > ${before}`
	    }

	query += ` ORDER BY messages.created_at DESC
		LIMIT 25`

	db.raw(query).then(data => res.json(data['rows'])).catch(err => res.status(400).json('unable to get chats!'));

}

const createChat = (req, res, db) => {

	let {otherParticipantID, requestorID} = req.body;

	let otherParticipant;

	db.raw(`SELECT name, photo_url FROM users WHERE id = ${otherParticipantID}`)
	.then(data => {otherParticipant = data['rows']})
	.catch(err => console.log('Could not find user'));
	//Return/end if error

	if (otherParticipant.id === requestorID) {
		console.log('Cannot chat with yourself');
		//Return/end if true
	}

	db.raw(`SELECT conversation_id FROM participants WHERE user_id = ${otherParticipantID}
			INTERSECT
			SELECT conversation_id FROM participants WHERE user_id = ${requestorID}`)
	.then(data => {
		console.log(data['rows'])
		//if data is empty continue
		//if conversation exists, redirect to /api/chats/:chatID
	})
	.catch(err => console.log('Could not find common chat'));

	db.raw(`INSERT INTO conversations DEFAULT VALUES RETURNING id`)
	.then(id => {console.log('Use id to create convo')})
	.catch(err => console.log('Could not insert new chat'));

	db.raw(`INSERT INTO participants (user_id, chat_id) VALUES
			(${requestorID}, ${chat_id}),
			(${otherParticipantID}, ${chat_id}))`)
	.then(console.log)
	.catch(err => console.log('Could not insert participants'));

	/*
		if all goes well, respond with relevant data
	*/
}

const getChat = (req, res, db) => {
	res.json('Get chat by id');
}

module.exports = {
	getChats : getChats,
	getChat : getChat,
	createChat : createChat
}