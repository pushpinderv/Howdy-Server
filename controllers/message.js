const getMessages = (req, res, db) => {
	res.json('Get Messages for chat id');
}

const createMessage = (req, res, db) => {
	res.json('Create Message for chat id');
}

module.exports = {
	getMessages : getMessages,
	createMessage : createMessage
}