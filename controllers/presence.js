const getLastOnline = (req, res, db) => {
	let {userID} = req.params;
	db.raw(`SELECT last_online from users where id = ${userID}`)
		.then(data => {
			let last_online = data['rows'][0].last_online;
				res.json(last_online);
				})
		.catch(err => res.status(400).json(''));
} 

const updateLastOnline = (value, userID, db) => {
	let entry = value ? `'${value}'` : null;
	db.raw(`update "users" set "last_online" = ${entry} where "id" = ${userID}`)
	.then(() => {console.log('Updated successful')})
	.catch(err => {console.log});
}

module.exports = {
	updateLastOnline : updateLastOnline,
	getLastOnline : getLastOnline
}