var path = require('path');
var multer = require('multer');
var storage = multer.diskStorage({
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
var upload = multer({storage: storage});
// var upload = multer({dest: 'uploads/'});

module.exports = function(app) {

	app.get('/test', (req, res) => {
		res.json({fucker: 20});
		console.log("somebody is trying to get us!");
	});

}
