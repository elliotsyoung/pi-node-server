var Promise = require("bluebird");
var fs = require('fs');
var using = Promise.using;
var getConnection = require("../config/mysql");
var jwt = require('jsonwebtoken');
var uuid = require("uuid/v1");

module.exports = function(jwt_key) {
	return {
		show: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else {
					Promise.join(using(getConnection(), connection => {
						var query = "SELECT message, status, messages.created_at AS created_at, contact, " +
						"company, users.type, picture, HEX(user_id) AS user_id, HEX(messages.id) AS id FROM messages " +
						"LEFT JOIN users ON messages.user_id = users.id WHERE proposal_id = " +
						"(SELECT proposal_id FROM offers LEFT JOIN proposals ON proposal_id = id WHERE " +
						"proposal_id = UNHEX(?) AND (proposals.user_id = UNHEX(?) OR offers.user_id = UNHEX(?)) " +
						"AND offers.status > 1 AND proposals.status > 1 LIMIT 1) ORDER BY created_at";
						return connection.execute(query, [req.params.proposal_id, payload.id, payload.id]);
					}), using(getConnection(), connection => {
						var query = "UPDATE messages SET status = 1 WHERE proposal_id = UNHEX(?) AND " +
						"user_id != UNHEX(?)";
						return connection.execute(query, [req.params.proposal_id, payload.id]);
					}), (messages, read) => {
						if (messages.length < 1)
						throw {status: 400, message: "No conversation found."};
						console.log(read[0]);
						callback(false, messages[0]);
					})
					.catch(err => {
						callback({status: 400, message: "Please contact an admin."});
					});
				}
			});
		},
		create: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else if (!req.body.message)
					callback({status: 400, message: "A message cannot be empty."});
				else if (!req.body.proposal_id)
					callback({status: 400, message: "No proposal provided."});
				else
					using(getConnection(), connection => {
						var id = uuid().replace(/\-/g, "");
						var query = "INSERT INTO messages SET id = UNHEX(?), message = ?, " +
						"status = 0, created_at = NOW(), updated_at = NOW(), proposal_id = UNHEX(?), " +
						"user_id = UNHEX(?)";
						return connection.execute(query, [id, req.body.message, req.body.proposal_id, payload.id]);
					})
					.spread(data => {
						callback(false, data);
					})
					.catch(err => {
						callback({status: 400, message: "Please contact an admin."});
					});
			});
		}
	}
};
