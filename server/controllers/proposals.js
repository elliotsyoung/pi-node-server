module.exports = function(jwt_key) {
	var proposal = require('../models/proposal')(jwt_key);
	return {
		getMyProposals: function(req, res) {
			proposal.getMyProposals(req, function(err, data) {
				if (err)
					res.status(err.status).json({message: err.message});
				else
					res.json(data);
			});
		},
		getMyApplications: function(req, res) {
			proposal.getMyApplications(req, function(err, data) {
				if (err)
					res.status(err.status).json({message: err.message});
				else
					res.json(data);
			});
		},
		getPercentCompleted: function(req, res) {
			proposal.getPercentCompleted(req, function(err, data) {
				if (err)
					res.status(err.status).json({message: err.message});
				else
					res.json(data);
			});
		},
		getProposalsForPage: function(req, res) {
			proposal.getProposalsForPage(req, function(err, data) {
				if (err)
					res.status(err.status).json({message: err.message});
				else
					res.json(data);
			});
		},
		show: function(req, res) {
			proposal.show(req, function(err, data) {
				if (err)
					res.status(err.status).json({message: err.message});
				else
					res.json(data);
			});
		},
		create: function(req, res) {
			proposal.create(req, function(err, data) {
				if (err)
					res.status(err.status).json({message: err.message});
				else
					res.json(data);
			});
		},
		delete: function(req, res) {
			proposal.delete(req, function(err, data) {
				if (err)
					res.status(err.status).json({message: err.message});
				else
					res.json(data);
			});
		},
		uploadFiles: function(req, res) {
			proposal.uploadFiles(req, function(err, data) {
				if (err)
					res.status(err.status).json({message: err.message});
				else
					res.json(data);
			});
		},
	}
}
