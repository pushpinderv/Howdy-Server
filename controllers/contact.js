
const getContacts = (req, res, db) => {
	
	const {userID} = req.params;
	console.log('Contact:' + userID);

	db.raw(
		`SELECT 
		name, email, photo_url, time_stamp, chat_id
		FROM
		(select cast((each(contacts)).key as int) AS id, (each(contacts)).value AS name from users where id = ${userID}) t1 
		INNER JOIN
		(SELECT id, email, photo_url from users) t2
		ON t1.id = t2.id
		LEFT JOIN
		(SELECT
		messages.created_at as time_stamp, messages.user_id as id, messages.chat_id as chat_id
		FROM chats
		INNER JOIN messages
			ON messages.chat_id = chats.id AND messages.user_id != ${userID}
		ORDER BY time_stamp DESC LIMIT 1) t3 ON t1.id = t3.id`)
		.then(data =>{
		res.json(data['rows'])
		}
		)
	.catch(err => res.status(400).json('unable to get contacts!'));
}

const createContact = (req, res, db) => {

	const {userID} = req.params;
	const {contactID, name} = req.body;
	let keyValuePair = `'"${contactID}" => "${name}"'`;
	console.log(keyValuePair);
	db('users')
	.update('contacts', db.raw('contacts || ' + keyValuePair))
	.where('id',userID)
	.returning('contacts')
	.then(contacts =>{res.json(contacts)})
	.catch(err => res.status(400).json('unable to add contact!'));
}

module.exports = {
	getContacts : getContacts,
	createContact : createContact
}