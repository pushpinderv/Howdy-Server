const multer = require('multer');
const fs = require('fs-extra');
const constants = require('../constants');
const path = require('path');

// Set Storage Engine
const storage = multer.diskStorage({
	destination : (req, file, cb) => {
		const {userID} = req.params;
		let path = `C:/wamp64/www/howdy/profile_photos/${userID}/`;

		fs.pathExists(path)
  			.then(exists => {
  				if(exists)
  					fs.emptyDir(path)
  						.then(() => {cb(null, path)})
						.catch((err) => {cb(null, path)});
  				else
  					fs.mkdir(path)
						.then(() => {cb(null, path)})
						.catch((err) => {cb(null, path)});
  			})
					
	},
	filename : (req ,file, cb) => {
		cb(null, file.fieldname + '-' + Date.now() + '.jpg');
	}
});

// Init Upload
const upload = multer({
	storage : storage
}).single('image');

const uploadPhoto = (req, res, db, io) => {

	let {userID} = req.params;

	upload(req, res, (err) => {
		if(err)
		{
			res.status(400).json('Error uploading profile photo')
		}
		else
		{
			// console.log(req.file.filename);
			let url = `${constants.IMAGE_DIRECTORY_URL}/howdy/profile_photos/${userID}/${path.basename(req.file.filename)}`
			console.log(url);

            db.raw(`update "users" set "photo_url" = '${url}' where "id" = ${userID}`)
			.then(()=>{
					
					console.log('Success!!');
					res.json({"url" : url});
					console.log(`Emitting to room ${userID}`);
					io.to(userID).emit('profile-photo-updated', {room : userID, url : url});
				}
				)	
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

const getName = (req, res, db) => {
	let {userID} = req.params;
	db.raw(`SELECT name from users WHERE id = ${userID}`)
		.then(data => {
			console.log(data['rows'][0].name);
			res.json(data['rows'][0].name);
		})
		.catch(err => res.status(400).json('Error getting profile name'))
}

const setName = (req, res, db) => {
	let {userID} = req.params;
	let {name} = req.body;
	db.raw(`UPDATE users SET name = '${name}' WHERE id = ${userID}`)
		.then(() => {
			res.json(name);
		})
		.catch(err => res.status(400).json('Error setting profile name'))
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
	getName : getName,
	setName : setName,
	handleProfileGet : handleProfileGet
}