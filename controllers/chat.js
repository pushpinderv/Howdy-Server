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

	db.transaction(trx => {
			return trx.raw(`SELECT id, name, photo_url FROM users WHERE id = ${otherParticipantID}`)
				.then(data => {
					otherParticipant = data['rows'][0];
					// console.log(otherParticipant);
					if (otherParticipant.id === requestorID) {
						throw new Error('Cannot chat with self');
					}
					return trx.raw(`SELECT chat_id FROM participants WHERE user_id = ${otherParticipantID}
							INTERSECT
							SELECT chat_id FROM participants WHERE user_id = ${requestorID}`)
					.then(data => {
						console.log('reached 0')
						console.log(data['rows'])
						if(data['rows'].length === 0)
						{
							console.log('reached 1');
						//if data is empty continue
						return trx.raw(`INSERT INTO chats DEFAULT VALUES RETURNING id`)
						.then(data => {
							//convo id
							let id = data['rows'][0].id;
							console.log(id); 
							console.log('reached 2');
							let query = `INSERT INTO participants (user_id, chat_id) VALUES (${requestorID}, ${id}), (${otherParticipantID}, ${id})`;
							console.log(query);	
							return trx.raw(query)
								.then(data => {
								res.json('Chat created!')
							})
						})


						}
						else
						//if conversation exists, redirect to /api/chats/:chatID
						res.redirect(`/chats/${data['rows'][0].chat_id}`)
					})
				})
			.then(trx.commit)
			.catch(trx.rollback)	
		})
	.catch(err => res.status(400).json('unable to create chat'))

}

const getChat = (req, res, db) => {
	res.json('Get chat by id');
}

module.exports = {
	getChats : getChats,
	getChat : getChat,
	createChat : createChat
}