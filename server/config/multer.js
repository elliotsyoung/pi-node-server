const multer = require('multer');
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, `./uploads`)
	},
	filename: function (req, file, cb) {
		cb(null, new Date().toISOString().
    replace(/T/, '-').      // replace T with a space
    replace(/\..+/, '').     // delete the dot and everything after)
    replace(/ /g, '_')  + '-' + file.originalname.replace(/ /g, '_'));
	}
});
module.exports = multer({storage: storage});
// var upload = multer({dest: 'uploads/'});
