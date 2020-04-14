
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

module.exports = {
	getContactInfo : getContactInfo
}