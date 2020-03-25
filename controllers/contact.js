// const parseHStore = (data) => {

// }
const getContacts = (req, res, db) => {
	
	const {userID} = req.params;
	console.log('Contact:' + userID);

	// db('users')
	// .select(db.raw('hstore_to_json (contacts) contacts'))
	// .where('id',userID)
	// .then(data =>{
	// 	res.json(data[0]['contacts'])
	// })
	// .catch(err => res.status(400).json('unable to get contacts!'));

	db.raw(
		`SELECT 
		name, email, photo_url,t3.time_stamp 
		FROM
		(select cast((each(contacts)).key as int) AS id, (each(contacts)).value AS name from users where id = ${userID}) t1 
		INNER JOIN
		(SELECT id, email, photo_url from users) t2
		ON t1.id = t2.id
		FULL JOIN
		(SELECT
		 messages.created_at as time_stamp, messages.user_id as id
		FROM chats
		INNER JOIN participants other_participants
			ON other_participants.chat_id = chats.id AND other_participants.user_id = ${userID}
		INNER JOIN messages
			ON messages.chat_id = chats.id
		LIMIT 1) t3 ON t1.id = t3.id`).then(data =>{
		res.json(data['rows'])
	})
	.catch(err => res.status(400).json('unable to get contacts!'));
}

const createContact = (req, res, db) => {

	const {userID} = req.params;
	const {contactID, name} = req.body;
	// console.log(`UserId is ${userID}, Contact Id is ${contactID}, contact name is ${name}`);
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