module.exports = function(jwt_key) {
	var report = require('../models/report')(jwt_key);
	return {
		index: function(req, res) {
			report.index(req, function(err, data) {
				if (err)
					res.status(err.status).json({message: err.message});
				else
					res.json(data);
			});
		},
		getReportsForProposal: function(req, res) {
			report.getReportsForProposal(req, function(err, data) {
				if (err)
					res.status(err.status).json({message: err.message});
				else
					res.json(data);
			});
		},
		create: function(req, res) {
			report.create(req, function(err, data) {
				if (err)
					res.status(err.status).json({message: err.message});
				else
					res.json(data);
			});
		}
	}
}
