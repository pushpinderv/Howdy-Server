const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const constants = require('../constants');

// Set Storage Engine
const storage = multer.diskStorage({
	destination : (req, file, cb) => {
		const {userID} = req.params;
		let path = `C:/wamp64/www/howdy/profile_photos/${userID}/`;
		fs.mkdir(path)
			.then(() => {cb(null, path)})
			.catch((err) => {cb(null, path)});
		
	},
	filename : (req ,file, cb) => {
		cb(null, file.fieldname + path.extname(file.originalname));
	}
});

// Init Upload
const upload = multer({
	storage : storage
}).single('image');

const uploadPhoto = (req, res, db) => {

	let {userID} = req.params;

	upload(req, res, (err) => {
		if(err)
		{
			res.status(400).json('Error uploading profile photo')
		}
		else
		{
			console.log(req.file);
			let url = `${constants.IMAGE_DIRECTORY_URL}/howdy/profile_photos/${userID}/image`
			console.log(url);

            db.raw(`update "users" set "photo_url" = '${url}' where "id" = ${userID}`)
			.then(()=>{
				console.log('Success!!');
				res.json({"url" : url})})
			.catch(err => res.status(400).json('Error storing profile photo'));

			
		}
	})

}

const getPhoto = (req, res, db) => {
	let {userID} = req.params;
	db.raw(`SELECT photo_url from users WHERE id = ${userID}`)
		.then(data => {
			console.log(data['rows'][0].photo_url);
			res.json(data['rows'][0].photo_url);
		})
		.catch(err => res.status(400).json('Error getting profile photo'))
}

const handleProfileGet = (req, res, db) => {

	const { userId } = req.params;

	db.select('*').from('users').where({
		id: userId
	})
	.then(user => {
		if(user.length){
		res.json(user[0])
	}
		else{
		res.status(400).json('Not found');	
		}
	})
	.catch(err => res.status(400).json('Error getting user'));	
}

module.exports = {
	getPhoto : getPhoto,
	uploadPhoto : uploadPhoto,
	handleProfileGet : handleProfileGet
}