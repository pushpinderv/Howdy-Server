const getContact = (contactID, req, res, db) => {

	const {userID} = req.params;

	db.raw(
		`SELECT 
		t2.id AS user_id,t1.name AS name, email, photo_url, chat_id, time_stamp,last_online
		FROM
		(select cast((each(contacts)).key as int) AS id, (each(contacts)).value AS name from users where id = ${userID}) t1 
		INNER JOIN
		(SELECT id, email, photo_url, last_online from users) t2
		ON t1.id = t2.id
		LEFT JOIN
		(SELECT
		chats.id AS chat_id, other_participants.user_id AS id, messages.created_at AS time_stamp
		FROM chats
		LEFT JOIN messages ON chats.last_message_id = messages.id
		INNER JOIN participants other_participants
			ON other_participants.chat_id = chats.id
				AND other_participants.user_id != ${userID}
		INNER JOIN users other_users ON other_participants.user_id = other_users.id
		INNER JOIN participants auth_user
			ON auth_user.chat_id = chats.id
				AND auth_user.user_id = ${userID}) t3 ON t1.id = t3.id
		WHERE t2.id = ${contactID}`)
		.then(data =>{
		res.json(data['rows'][0])
		}
		)
	.catch(err => res.status(400).json('unable to get contact!'));

}

const getContacts = (req, res, db) => {
	
	const {userID} = req.params;

	db.raw(
		`SELECT 
		t2.id AS user_id,t1.name AS name, email, photo_url, chat_id, time_stamp, last_online
		FROM
		(select cast((each(contacts)).key as int) AS id, (each(contacts)).value AS name from users where id = ${userID}) t1 
		INNER JOIN
		(SELECT id, email, photo_url, last_online from users) t2
		ON t1.id = t2.id
		LEFT JOIN
		(SELECT
		chats.id AS chat_id, other_participants.user_id AS id, messages.created_at AS time_stamp
		FROM chats
		LEFT JOIN messages ON chats.last_message_id = messages.id
		INNER JOIN participants other_participants
			ON other_participants.chat_id = chats.id
				AND other_participants.user_id != ${userID}
		INNER JOIN users other_users ON other_participants.user_id = other_users.id
		INNER JOIN participants auth_user
			ON auth_user.chat_id = chats.id
				AND auth_user.user_id = ${userID}) t3 ON t1.id = t3.id
				`)
		.then(data =>{
		res.json(data['rows'])
		}
		)
	.catch(err => res.status(400).json('unable to get contacts!'));
}

const createContact = (req, res, db) => {

	const {userID} = req.params;
	const {contactEmail, contactName} = req.body;

	let valid = false;

	if(contactName && contactEmail)
		if(contactName.length && contactEmail.length)
			valid = true;

	if(!valid)
		return res.status(400).json('Invalid data');	

	db.transaction(trx => {
		let contactIDQuery = `SELECT id from users where email = '${contactEmail}'`;
		console.log(contactIDQuery);
		return trx.raw(contactIDQuery)
				.then(data => {
					
					// console.log(data);

					//Find contact id from db in transaction and then create this key val pair
					let contactID = data['rows'][0].id;
					let numberID = Number(userID);

					console.log('Contact id is:', contactID);
					console.log('User id is:', numberID);

					if(contactID)
					{	
					let keyValuePair = `'"${contactID}" => "${contactName}"'`;
					console.log(keyValuePair);

					return trx('users')
						.update('contacts', trx.raw("COALESCE(contacts, '') || " + keyValuePair + ` where id = ${numberID}`))
						.returning('contacts')
						.then(contacts =>{
							// res.json(contacts)
							// return res.redirect(`/contacts/${userID}`)
							getContacts(req, res, db);
						})
					}

					else
					{
						throw new Error('unable to find contact id');
					}

				})
				.then(trx.commit)
				.catch(trx.rollback)
	})
	.catch(err => {res.status(400).json('unable to add contact!')});

}

const updateContact = (req, res, db) => {

	const {userID} = req.params;
	const {contactEmail, contactName} = req.body;

	db.transaction(trx => {
		let contactIDQuery = `SELECT id from users where email = '${contactEmail}'`;
		console.log(contactIDQuery);
		return trx.raw(contactIDQuery)
				.then(data => {
					
					// console.log(data);

					//Find contact id from db in transaction and then create this key val pair
					let contactID = data['rows'][0].id;
					let numberID = Number(userID);

					console.log('Contact id is:', contactID);
					console.log('User id is:', numberID);

					if(contactID)
					{	
					let keyValuePair = `'"${contactID}" => "${contactName}"'`;
					console.log(keyValuePair);

					return trx('users')
						.update('contacts', trx.raw("COALESCE(contacts, '') || " + keyValuePair + ` where id = ${numberID}`))
						.returning('contacts')
						.then(contacts =>
						{
							console.log(contacts);
							getContact(contactID, req, res ,trx);
						})
					}

					else
					{
						throw new Error('unable to find contact id');
					}

				})
				.then(trx.commit)
				.catch(trx.rollback)
	})
	.catch(err => {res.status(400).json('unable to update contact!')});

}

module.exports = {
	getContact : getContact,
	getContacts : getContacts,
	createContact : createContact,
	updateContact : updateContact
}