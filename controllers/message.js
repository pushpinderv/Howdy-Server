const getMessages = (req, res, db) => {

	let {chatID, userID} = req.params;
	let query = `SELECT
					id,
					content,
					created_at,
					user_id = ${userID} AS mine
				FROM messages
				WHERE chat_id = ${chatID}`;

	let before = '';
		if(req.query.before)
			before = req.query.before.trim(); 
		if (before !== "") {
		query += ` AND id < ${before}`
	    } 
	
	query += ` ORDER BY created_at DESC LIMIT 25`;

	db.transaction(trx => {
		let participantExistsQuery = `SELECT EXISTS (SELECT 1 FROM participants WHERE user_id = ${userID} AND chat_id = ${chatID})`;
		console.log(participantExistsQuery);
		return trx.raw(participantExistsQuery)
				.then(data => {
					let exists = data['rows'][0].exists;
					console.log('reached hereeeeeee!')
					if(exists)
					{
						return trx.raw(query)
						.then(data => {
							res.json(data['rows']);
						})
					}
					else{
					throw new Error('Participant not found!')	
					}
				}) 
				.then(trx.commit)
				.catch(trx.rollback)
	})
	.catch(err => res.status(400).json([]));;

}

const createMessage = (req, res, db, users, io) => {
	let {chatID} = req.params;
	let {userID, content} = req.body;
	db.transaction(trx => {
		let participantExistsQuery = `SELECT EXISTS (SELECT 1 FROM participants WHERE user_id = ${userID} AND chat_id = ${chatID})`;
		console.log(participantExistsQuery);
		return trx.raw(participantExistsQuery)
				.then(data => {
					let exists = data['rows'][0].exists;
					let insertQuery = `INSERT INTO messages (content, user_id, chat_id) VALUES
					('${content}', ${userID}, ${chatID}) RETURNING id, created_at`;

					if(exists)
					{
					return trx.raw(insertQuery)
					.then(data => {
						let id = data['rows'][0].id;
						let created_at = data['rows'][0].created_at;
						console.log('reached here!')
						let updateQuery = `UPDATE chats SET last_message_id = ${id}
											WHERE id = ${chatID}`;
						return trx.raw(updateQuery)
						.then(data => {
							
							res.json('Message posted')

							let message = { 
								"id" : id,
								"content" : content,
								"created_at" : created_at,
								"mine" : true
							};

							//Send it to the sender
							io.to(`${users[userID]}`).emit('chat-message', message);

							//Send it to other participant[s]


						})
					})
					}
					else{
						throw new Error('Could not find participant');
					}
				})
				.then(trx.commit)
				.catch(trx.rollback)
	})
	.catch(err => res.status(400).json('unable to post message'));
}

module.exports = {
	getMessages : getMessages,
	createMessage : createMessage
}