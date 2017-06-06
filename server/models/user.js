var Promise = require("bluebird");
var using = Promise.using;
var getConnection = require("../config/mysql");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var uuid = require("uuid/v1");
var mailService = require('./MailService');

module.exports = function(jwt_key) {
	return {
		show: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else
					using(getConnection(), connection => {
						var query = "SELECT company, contact, email, picture, homepage, facebook, instagram, " +
						"linkedin, twitter FROM users LEFT JOIN urls ON users.id = user_id WHERE id = UNHEX(?) LIMIT 1";
						return connection.execute(query, [req.params.id]);
					})
					.spread(data => {
						if (data.length != 1)
							callback({status: 400, message: "Could not find user."});
						else
							callback(false, data[0]);
					})
					.catch(err => {
						callback({status: 400, message: "Please contact an admin."});
					});
			});
		},
		notifications: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else {
					Promise.join(using(getConnection(), connection => {
						if (payload.type == 0) // maker query
							// var query = "select u.id , COUNT(p.id) as proposals from users u " +
							// "LEFT OUTER JOIN proposals p on u.id = p.user_id " +
							// "WHERE u.id = UNHEX(?) GROUP BY u.id";
							var query = "SELECT u.id, u.hasNewOffer, u.hasNewMessage, p.proposals AS proposals, j.jobs AS jobs FROM users u " +
							"LEFT OUTER JOIN (SELECT user_id, COUNT(id) AS proposals FROM proposals WHERE status = 0 GROUP BY user_id) p " +
							"ON u.id = p.user_id " +
							"LEFT OUTER JOIN (SELECT user_id, COUNT(id) AS jobs FROM proposals WHERE status = 2 GROUP BY user_id) j " +
							"ON j.user_id = u.id " +
							"WHERE u.id = UNHEX(?)";
						else //supplier query
							// var query = "select u.id , COUNT(o.user_id) as proposals from users u " +
							// "LEFT OUTER JOIN offers o on o.user_id = u.id " +
							// "WHERE u.id = UNHEX(?) GROUP BY u.id"
							var query = "SELECT u.id, u.hasNewMessage, u.hasBeenAccepted, o.proposals AS proposals, j.jobs AS jobs FROM users u " +
							"LEFT OUTER JOIN (SELECT user_id, COUNT(proposal_id) AS proposals FROM offers WHERE status > 0 GROUP BY user_id) o " +
							"ON o.user_id = u.id " +
							"LEFT OUTER JOIN (SELECT user_id, COUNT(proposal_id) AS jobs FROM offers WHERE status = 2 GROUP BY user_id) j " +
							"ON j.user_id = u.id " +
							"WHERE u.id = UNHEX(?)"
						return connection.execute(query, [req.params.id]);
					}), using(getConnection(), connection => {
						if (payload.type == 0) //maker query
							var query = "SELECT COUNT(*) as unread FROM messages WHERE proposal_id in " +
							"(SELECT id FROM proposals WHERE user_id = UNHEX(?)) " +
							"AND status = 0 AND user_id != UNHEX(?)";
						else // supplier query
							var query = "SELECT COUNT(*) AS unread FROM messages WHERE proposal_id in " +
							"(SELECT proposal_id FROM offers WHERE user_id = UNHEX(?)) " +
							"AND status = 0 AND user_id != UNHEX(?)";
						return connection.execute(query, [req.params.id, req.params.id]);
					}), (proposals, messages) => {
						var data = {};
						if (proposals[0].length != 1) {
							callback({status: 400, message: "Could not find user."});
						} else {
							data.hasNewOffer = proposals[0][0].hasNewOffer;
							data.proposals = proposals[0][0].proposals;
							data.jobs = proposals[0][0].jobs;
							data.messages = messages[0][0].unread;
							data.hasNewMessage = proposals[0][0].hasNewMessage;
							data.hasBeenAccepted = proposals[0][0].hasBeenAccepted;
							callback(false, data);
						}
					})
					.catch(err => {
						callback({status: 400, message: "Please contact an admin."});
					});
				}
			});
		},
		update: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else {
					using(getConnection(), connection => {
						var query = "UPDATE users SET ?, updated_at = NOW() WHERE id = UNHEX(?) LIMIT 1";
						return connection.execute(query, [req.body, payload.id]);
					})
					.spread(data => {
						if (data.changedRows == 0)
							throw {status: 400, message: "Failed to save changes."};
						else
							return using(getConnection(), connection => {
								var query = "SELECT *, HEX(id) AS id FROM users WHERE id = UNHEX(?) LIMIT 1";
								return connection.execute(query, [payload.id]);
							});
					})
					.spread(data => {
						var evergreen_token = jwt.sign({
							id: data[0].id,
							type: data[0].type,
							company: data[0].company,
							contact: data[0].contact,
							created_at: data[0].created_at
						}, jwt_key, {expiresIn: "5d"});
						callback(false, evergreen_token);
					})
					.catch(err => {
						callback({status: 400, message: "Please contact an admin."});
					});
				}
			});
		},
		delete: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else
					using(getConnection(), connection => {
						return connection.execute("DELETE FROM users WHERE id = UNHEX(?) LIMIT 1", [payload.id]);
					})
					.spread(data => {
						if (data.affectedRows == 0)
							callback({status: 400, message: "Failed to delete your account."});
						else
							callback(false);
					})
					.catch(err => {
						callback({status: 400, message: "Please contact an admin."});
					});
			});
		},
		changePassword: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d$@$!%*?&](?=.{7,})/.test(req.body.new))
					callback({status: 400, message: "Password must be at least 8 characters long and have a lowercase letter, an uppercase letter, and a number."});
				else {
					bcrypt.genSalt(10, function(err, salt) {
						if (err)
							callback({status: 400, message: "Please contact an admin."});
						else {
							bcrypt.hash(req.body.new, salt, function(err, hash) {
								if (err)
									callback({status: 400, message: "Please contact an admin."});
								else {
									using(getConnection(), connection => {
										var query = "UPDATE users SET password = ?, updated_at = NOW() WHERE id = UNHEX(?) LIMIT 1";
										return connection.execute(query, [hash, payload.id]);
									})
									.spread(data => {
										if (data.changedRows == 0)
											throw {status: 400, message: "Unable to change password."};
										else
											callback(false);
									})
									.catch(err => {
										if (err.status)
											callback(err);
										else
											callback({status: 400, message: "Please contact an admin."});
									});
								}
							});
						}
					});
				}
			});
		},
		register: function(req, callback) {
			if (req.body.type === undefined || !req.body.company || !req.body.contact || !req.body.email
			|| !req.body.password || !req.body.confirm_password)
				callback({status: 400, message: "All form fields are required."});
			// Validate company:
			else if (!req.body.company)
				callback({status: 400, message: "Company name cannot be blank."});
			// Validate contact:
			else if (!/^[a-z ]{2,32}$/i.test(req.body.contact))
				callback({status: 400, message: "Invalid contact name."});
			// Validate email:
			else if (!/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/.test(req.body.email))
				callback({status: 400, message: "Invalid email. Email format should be: email@mailserver.com."});
			// Validate password:
			else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d$@$!%*?&](?=.{7,})/.test(req.body.password))
				callback({status: 400, message: "Password must be at least 8 characters long and have a lowercase letter, an uppercase letter, and a number."});
			// Validate confirm_password:
			else if (req.body.password != req.body.confirm_password)
				callback({status: 400, message: "Passwords do not match."});
			// Else valid new user:
			else {
				// Encrypt password and save:
				bcrypt.genSalt(10, function(err, salt) {
					if (err) {
						callback({status: 400, message: "Please contact an admin."});
					} else {
						bcrypt.hash(req.body.password, salt, function(err, hash) {
							if (err) {
								callback({status: 400, message: "Please contact an admin."});
							} else {
									using(getConnection(), connection => {
										var data = [uuid().replace(/\-/g, ""), req.body.type, req.body.company,
										req.body.contact, req.body.email, hash];
										var query = "INSERT INTO users SET id = UNHEX(?), type = ?, company = ?, "+
										"contact = ?, email = ?, password = ?, created_at = NOW(), updated_at = NOW()";
										return connection.execute(query, data);
									})
									.then(() => {
										return using(getConnection(), connection => {
											var query = "SELECT *, HEX(id) AS id FROM users WHERE email = ? LIMIT 1";
											return connection.execute(query, [req.body.email]);
										});
									})
									.spread(data => {
										var evergreen_token = jwt.sign({
											id: data[0].id,
											type: data[0].type,

											company: data[0].company,
											contact: data[0].contact,
											created_at: data[0].created_at
										}, jwt_key, {expiresIn: "5d"});

										mailService.sendWelcomeMail(data[0], evergreen_token, callback);
									})
									.catch(err => {
										if (err["code"] == "ER_DUP_ENTRY")
											callback({status: 400, message: "Email already in use, please log in."});
										else
											callback({status: 400, message: "Please contact an admin."});
									});
								};
						});
					}
				});
			}
		},
		registerLinkedIn: function(req, callback) {
			if (req.body.type === undefined || !req.body.company || !req.body.contact || !req.body.email)
				callback({status: 400, message: "All form fields are required."});
			// Validate company:
			else if (!req.body.company)
				callback({status: 400, message: "Company name cannot be blank."});
			// Validate contact:
			else if (!/^[a-z ]{2,32}$/i.test(req.body.contact))
				callback({status: 400, message: "Invalid contact name."});
			// Validate email:
			else if (!/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/.test(req.body.email))
				callback({status: 400, message: "Invalid email. Email format should be: email@mailserver.com."});
			// Else valid new user:
			else {
				// Encrypt password and save:
				bcrypt.genSalt(10, function(err, salt) {
					if (err) {
						callback({status: 400, message: "Salt error."});
					} else {
						bcrypt.hash(uuid().replace(/\-/g, ""), salt, function(err, hash) {
							if (err) {
								callback({status: 400, message: "Hash error."});
							} else {
								using(getConnection(), connection => {
									var data = [uuid().replace(/\-/g, ""), req.body.type, req.body.company, req.body.contact,
									req.body.email, hash];
									var query = "INSERT INTO users SET id = UNHEX(?), type = ?, company = ?, contact = ?, " +
									"email = ?, password = ?, created_at = NOW(), updated_at = NOW()";
									return connection.execute(query, data);
								})
								.then(() => {
									return using(getConnection(), connection => {
										var query = "SELECT *, HEX(id) AS id FROM users WHERE email = ? LIMIT 1";
										return connection.execute(query, [req.body.email]);
									});
								})
								.spread(data => {
									var evergreen_token = jwt.sign({
										id: data[0].id,
										type: data[0].type,

										company: data[0].company,
										contact: data[0].contact,
										created_at: data[0].created_at
									}, jwt_key, {expiresIn: "5d"});
									mailService.sendWelcomeMail(data[0], evergreen_token, callback);
								})
								.catch(err => {
									if (err["code"] == "ER_DUP_ENTRY")
										callback({status: 400, message: "Email already in use, please log in."});
									else
										callback({status: 400, message: "Please contact an admin."});
								});
							}
						});
					}
				});
			}
		},
		login: function(req, callback) {
			// Validate login data:
			if (!req.body.email || !req.body.password)
				callback({status: 400, message: "All form fields are required."});
			else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d$@$!%*?&](?=.{7,})/.test(req.body.password))
				callback({status: 400, message: "Invalid password."});
			else
				using(getConnection(), connection => {
					// Get user by email:
					var query = "SELECT *, HEX(id) AS id FROM users WHERE email = ? LIMIT 1";
					return connection.execute(query, [req.body.email]);
				})
				.spread(data => {
					if (data.length == 0)
						throw {status: 400, message: "Email does not exist, please register."};
					else
						// Check valid password:
						bcrypt.compare(req.body.password, data[0].password, function(err, isMatch) {
							if (err)
								callback({status: 400, message: "Invalid email/password."});
							else if (!isMatch)
								callback({status: 400, message: "Email/password does not match."});
							else {
								var evergreen_token = jwt.sign({
									id: data[0].id,
									type: data[0].type,

									company: data[0].company,
									contact: data[0].contact,
									created_at: data[0].created_at,
									picture: data[0].picture,
								}, jwt_key, {expiresIn: "5d"});
								callback(false, evergreen_token);
							}
						});
				})
				.catch(err => {
					if (err.status)
						callback(err);
					else
						callback({status: 400, message: "Please contact an admin."});
				});
		},
		loginLinkedIn: function(req, callback) {
			// Validate login data:
			if (!req.body.email)
				callback({status: 400, message: "LinkedIn login was unsuccessful"});
			else {
				using(getConnection(), connection => {
					// Get user by email:
					var query = "SELECT *, HEX(id) AS id FROM users WHERE email = ? LIMIT 1";
					return connection.execute(query, [req.body.email]);
				})
				.spread(data => {
					if (data.length == 0)
						throw {status: 400, message: "Email does not exist, please register."};
					else
						// Check valid password:
						var evergreen_token = jwt.sign({
							id: data[0].id,
							type: data[0].type,
							company: data[0].company,
							contact: data[0].contact,
							created_at: data[0].created_at
						}, jwt_key, {expiresIn: "5d"});
						callback(false, evergreen_token);
				})
				.catch(err => {
					if (err.status)
						callback(err);
					else
						callback({status: 400, message: "Please contact an admin."});
				});
			}
		},
		sendTicket: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else {
					using(getConnection(), connection => {
						var query = "SELECT * FROM users WHERE id = UNHEX(?) LIMIT 1";
						return connection.execute(query, [payload.id]);
					})
					.spread(data => {
						mailService.sendTicket(data, callback);
					})
					.catch(err => {
						if (err.status)
							callback(err);
						else
							callback({status: 400, message: "Please contact an admin."});
					});
				}
			});
		},
		setHasNewOffer: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else {
					using(getConnection(), connection => {
						var query = "UPDATE users SET hasNewOffer = ? WHERE id = UNHEX(?) LIMIT 1";
						return connection.execute(query, [req.body.hasNewOffer, payload.id]);
					})
					.spread(data => {
						if (data.changedRows == 0)
							throw {status: 400, message: "Failed to update offer notifications."};
						else
							callback(false);
					})
					.catch(err => {
						console.log(err)
						if (err.status)
							callback(err);
						else
							callback({status: 400, message: "Please contact an admin."});
					});
				}
			});
		},
		setHasNewMessage: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else {
					using(getConnection(), connection => {
						var query = "UPDATE users SET hasNewMessage = ? WHERE id = UNHEX(?) LIMIT 1";
						return connection.execute(query, [req.body.hasNewMessage, payload.id]);
					})
					.spread(data => {
						if (data.changedRows == 0)
							throw {status: 400, message: "Failed to update message notifications."};
						else
							callback(false);
					})
					.catch(err => {
						console.log(err)
						if (err.status)
							callback(err);
						else
							callback({status: 400, message: "Please contact an admin."});
					});
				}
			});
		},
		setHasBeenAccepted: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else {
					using(getConnection(), connection => {
						var query = "UPDATE users SET hasBeenAccepted = ? WHERE id = UNHEX(?) LIMIT 1";
						return connection.execute(query, [req.body.hasBeenAccepted, payload.id]);
					})
					.spread(data => {
						if (data.changedRows == 0)
							throw {status: 400, message: "Failed to update accepted notifications."};
						else
							callback(false);
					})
					.catch(err => {
						console.log(err)
						if (err.status)
							callback(err);
						else
							callback({status: 400, message: "Please contact an admin."});
					});
				}
			});
		},
	}
};
