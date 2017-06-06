module.exports = function(jwt_key) {
	var url = require('../models/url')(jwt_key);
	return {
		create: function(req, res) {
			url.create(req, function(err, data) {
				if (err)
					res.status(err.status).json({message: err.message});
				else
					res.end();
			});
		},
		uploadPicture: function(req, res) {
			url.uploadPicture(req, function(err, data, picture) {
				if (err)
					res.status(err.status).json({message: err.message});
				else
					res.clearCookie('evergreen_token').cookie('evergreen_token', data).json(picture);
			});
		},
	}
}
