module.exports = function(jwt_key) {
	var message = require('../models/message')(jwt_key);
	return {
		// index: function(req, res) {
		// 	message.index(req, function(err, data) {
		// 		if (err)
		// 			res.status(err.status).json({message: err.message});
		// 		else
		// 			res.json(data);
		// 	});
		// },
		show: function(req, res) {
			message.show(req, function(err, data) {
				if (err)
					res.status(err.status).json({message: err.message});
				else
					res.json(data);
			});
		},
		create: function(req, res) {
			message.create(req, function(err, data) {
				if (err)
					res.status(err.status).json({message: err.message});
				else
					res.json(data);
			});
		}
	}
}
