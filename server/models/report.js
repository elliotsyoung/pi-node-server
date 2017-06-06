var Promise = require("bluebird");
var using = Promise.using;
var getConnection = require("../config/mysql");
var jwt = require('jsonwebtoken');
var uuid = require("uuid/v1");

module.exports = function(jwt_key) {
	return {
		index: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else
					using(getConnection(), connection => {
						var query = "SELECT * FROM reports WHERE offer_id IN " +
						"(SELECT id FROM offers WHERE proposal_id IN " +
						"(SELECT id FROM proposals))" //WHERE id = 'proposal.id'
						return connection.execute(query);
					})
					.spread(data => {
						callback(false, data);
					})
					.catch(err => {
						callback({status: 400, message: "Please contact an admin."});
					});
			});
		},
		getReportsForProposal: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else
					using(getConnection(), connection => {
						// var query = "SELECT reports.*, HEX(offers.proposal_id) as 'proposal_id' FROM evergreendb.proposals " +
						// "JOIN offers ON offers.proposal_id = proposals.id JOIN reports on reports.offer_id = offers.id " +
						// "where HEX(proposals.id) = ?"
						var query = "SELECT *, HEX(proposal_id) AS 'proposal_id' FROM reports WHERE proposal_id = UNHEX(?) ORDER BY created_at"
						return connection.execute(query, [req.params.id]);
					})
					.spread(data => {
						callback(false, data);
					})
					.catch(err => {
						callback({status: 400, message: "Please contact an admin."});
					});
			});
		},
		create: function(req, callback) {
			console.log(req.body);
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else
					using(getConnection(), connection => {
						data = [uuid().replace(/\-/g, ""), req.body.input, req.body.output, req.body.shipped,
						req.body.note, payload.id, req.body.proposal_id];
						var query = "INSERT INTO reports SET id = UNHEX(?), status = 1, input = ?, output = ?, " +
						"shipped = ?, note = ?, created_at = NOW(), updated_at = NOW(), user_id = UNHEX(?), " +
						"proposal_id = UNHEX(?)";
						return connection.execute(query, data);
					})
					.spread(data => {
						if (data.changedRows == 0)
							throw {status: 400, message: "Unable to add report."};
						else
							return using(getConnection(), connection => {
								// Retrieve updated user:
								var query = "SELECT *, HEX(proposal_id) AS 'proposal_id' FROM reports WHERE proposal_id = UNHEX(?) ORDER BY created_at"
								return connection.execute(query, [req.body.proposal_id]);
							});
					})
					.spread(data => {
						callback(false, data);
					})
					.catch(err => {
						console.log(err)
						callback({status: 400, message: "Please contact an admin."});
					});
			});
		}
	}
};
