const getContacts = (req, res, db) => {
	const {userID} = req.body;

	db('users')
	.select('contacts')
	.where('id',userID)
	.then(data =>{res.json(data)})
	.catch(err => res.status(400).json('unable to get contacts!'));
}

const createContact = (req, res, db) => {
	const {userID, contactID, name} = req.body;
	// console.log(`UserId is ${userID}, Contact Id is ${contactID}, contact name is ${name}`);
	let keyValuePair = `'"${contactID}" => "${name}"'`;
	console.log(keyValuePair);
	db('users')
	.update('contacts', db.raw('contacts || ' + keyValuePair))
	.where('id',userID)
	.returning('contacts')
	.then(contacts =>{res.json(contacts)})
	.catch(err => res.status(400).json('unable to add contact!'));
	// res.status(200).json('success');
}

module.exports = {
	getContacts : getContacts,
	createContact : createContact
}