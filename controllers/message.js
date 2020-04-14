
function getContactInfo (otherUserID, userID, db) {
	return new Promise((resolve, reject) => {
	let info = {
		"name" : '',
		"email" : ''
	}

	let emailQuery = `SELECT email FROM users WHERE id = ${otherUserID}`;
	let contactNameQuery = `SELECT contacts -> '${otherUserID}' AS name FROM users WHERE id = ${userID}`;

	db.transaction(trx => {
		return trx.raw(emailQuery)
			.then(data => {
				let email = data['rows'][0].email;

				if(email)
				{
					info.email = email;
					// console.log('email is :', email);
					return trx.raw(contactNameQuery)
						.then(data => {

							let contactName = data['rows'][0].name;
							// console.log('name is :', contactName);
							if(contactName)
							{
							info.name = contactName;
							}
							console.log('returned info is :',info);
							resolve(info);
							// console.log('info is :',info);
						})
				} 
			})
			.then(trx.commit)
			.catch(trx.rollback)
	})
	.catch(err => {
		reject(info);
	})	

})

}

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

							let participantIDQuery = `SELECT
							other_participants.user_id AS id
							FROM chats
							LEFT JOIN messages ON chats.last_message_id = messages.id
							INNER JOIN participants other_participants
								ON other_participants.chat_id = chats.id
									AND other_participants.user_id != ${userID}
							INNER JOIN users other_users ON other_participants.user_id = other_users.id
							INNER JOIN participants auth_user
								ON auth_user.chat_id = chats.id
									AND auth_user.user_id = ${userID}
									WHERE chats.id = ${chatID}`;

							return trx.raw(participantIDQuery)
							.then(data => {

									let participantID = data['rows'][0].id;

									console.log('Other user id:',participantID);

									let message = { 
										"id" : id,
										"content" : content,
										"created_at" : created_at,
										"mine" : true,
										"chat_id" : chatID
									};

									//Send participant contact name and email to sender
									getContactInfo(participantID, userID, db)
									.then(info => {

										message.email = info.email;
										message.name = info.name;

										//Send it to the sender
										io.to(`${users[userID]}`).emit('chat-message', message);
									})
									.catch(err => {console.log('Socket error')});
							
									//Send sender email and contact name to participant
									getContactInfo(userID, participantID, db)
									.then(info => {
										message.email = info.email;
										message.name = info.name;
										message.mine = false;

										//Send it to other participant[s]
										io.to(`${users[participantID]}`).emit('chat-message', message);
									})
									.catch(err => {console.log('Socket error')});

								});

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
	.catch(err => {console.log('Error is:', err); res.status(400).json('unable to post message')});
}

module.exports = {
	getMessages : getMessages,
	createMessage : createMessage
}