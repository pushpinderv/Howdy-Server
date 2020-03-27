const getMessages = (req, res, db) => {
	res.json('Get Messages for chat id');
}

const createMessage = (req, res, db) => {
	let {chatID} = req.params;
	let {userID, content} = req.body;
	db.transaction(trx => {
		let participantExistsQuery = `SELECT EXISTS (SELECT 1 FROM participants WHERE user_id = ${userID} AND chat_id = ${chatID})`;
		return trx.raw(participantExistsQuery)
				.then(data => {
					let exists = data['rows'][0].exists;
					let insertQuery = `INSERT INTO messages (content, user_id, chat_id) VALUES
					('${content}', ${userID}, ${chatID}) RETURNING id, created_at`;
					return trx.raw(insertQuery)
					.then(data => {
						let id = data['rows'][0].id;
						let created_at = data['rows'][0].created_at;
						console.log('reached here!')
						let updateQuery = `UPDATE chats SET last_message_id = ${id}
											WHERE id = ${chatID}`;
						return trx.raw(updateQuery)
						.then(data => {res.json('Message posted')})
					})
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