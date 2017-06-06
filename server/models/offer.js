var Promise = require("bluebird");
var using = Promise.using;
var getConnection = require("../config/mysql");
var jwt = require('jsonwebtoken');
var mailService = require('./MailService');
var sig = require('amazon-s3-url-signer');
var bucket1 = sig.urlSigner('AKIAIFF4LTNLXH75IA2A', 'cH6vNKd7/jsdglxOrNpLm5SkMLsVRclFiuOumtrF', {
	host : 's3-us-west-1.amazonaws.com'
});
module.exports = function(jwt_key) {
	return {
		getOffersForProposal: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else {
					Promise.join(using(getConnection(), connection => {
						var query = "SELECT first, follow, cavitation, days, life, sga, profit, overhead, total, completion, company, HEX(user_id) AS " +
						"user_id FROM offers LEFT JOIN users ON user_id = id WHERE proposal_id = UNHEX(?) AND status > 0 " +
						"ORDER BY user_id";
						return connection.execute(query, [req.params.proposal_id]);
					}), using(getConnection(), connection => {
						var query = "SELECT material, weight, cost, HEX(user_id) AS user_id FROM materials WHERE " +
						"proposal_id = UNHEX(?) AND proposal_id IN (SELECT DISTINCT proposal_id FROM offers WHERE " +
						"proposal_id = UNHEX(?) AND status > 0) ORDER BY user_id";
						return connection.execute(query, [req.params.proposal_id, req.params.proposal_id]);
					}), using(getConnection(), connection => {
						var query = "SELECT type, labor, yield, rate, count, HEX(user_id) AS user_id FROM labors " +
						"WHERE proposal_id = UNHEX(?) AND proposal_id IN (SELECT DISTINCT proposal_id FROM offers " +
						"WHERE proposal_id = UNHEX(?) AND status > 0) ORDER BY user_id";
						return connection.execute(query, [req.params.proposal_id, req.params.proposal_id]);
					}), function(offers, materials, labors) {
						// Group related materials together:
						var materials_obj = {};
						for (var i = 0; i < materials[0].length; i++) {
							var material = materials[0][i];
							if (!materials_obj[`${material.user_id}`])
								materials_obj[`${material.user_id}`] = [];
							materials_obj[`${material.user_id}`].push({
								material: material.material,
								weight: material.weight,
								cost: material.cost
							});
						}

						// Group related labors together:
						var machines_obj = {};
						var manuals_obj = {};
						for (var i = 0; i < labors[0].length; i++) {
							var labor = labors[0][i];

							if (labor.type == 0) {
								if (!machines_obj[`${labor.user_id}`])
									machines_obj[`${labor.user_id}`] = [];
								machines_obj[`${labor.user_id}`].push({
									labor: labor.labor,
									yield: labor.yield,
									rate: labor.rate,
									count: labor.count
								});
							}
							else if (labor.type == 1) {
								if (!manuals_obj[`${labor.user_id}`])
									manuals_obj[`${labor.user_id}`] = [];
								manuals_obj[`${labor.user_id}`].push({
									labor: labor.labor,
									yield: labor.yield,
									rate: labor.rate,
									count: labor.count
								});
							}
						}

						// Map materials and labors to offer:
						for (var i = 0; i < offers[0].length; i++) {
							var offer = offers[0][i];
							offer.materials = materials_obj[`${offer.user_id}`];
							offer.machines = machines_obj[`${offer.user_id}`];
							offer.manuals = manuals_obj[`${offer.user_id}`];
							if (offer.user_id != payload.id && payload.type != 0) {
								delete offer.user_id;
								delete offer.company;
							}
						}

						callback(false, offers[0]);
					})
					.catch(err => {
						callback({status: 400, message: "Please contact an admin."});
					});
				}
			});
		},
		getAcceptedOffers: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else
					using(getConnection(), connection => {
						var user_id = (payload.type==0?"offers.user_id":"proposals.user_id")
						var query = "SELECT offers.*, users.type, picture, contact, company, offers.updated_at AS updated_at, " +
						"HEX(proposal_id) AS proposal_id FROM offers LEFT JOIN proposals ON offers.proposal_id = proposals.id " +
						"JOIN users ON users.id = " + user_id +
						" WHERE (offers.user_id = UNHEX(?) OR " +
						"proposals.user_id = UNHEX(?)) AND offers.status > 1";
						return connection.execute(query, [payload.id, payload.id]);
					})
					.spread(data => {
						callback(false, data);
					})
					.catch(err => {
						console.log(err)
						callback({status: 400, message: "Please contact an admin."});
					});
			});
		},
		index: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else if (payload.type != 0)
					callback({status: 401, message: "Only Makers are allowed to view offers."});
				else {
					Promise.join(using(getConnection(), connection => {
						var query = "SELECT HEX(o.user_id) AS user_id, u.picture AS picture, HEX(o.proposal_id) AS proposal_id, o.completion AS completion, " +
						"o.status, first, follow, cavitation, days, life, sga, profit, overhead, ROUND(tpp,2) AS tpp, ROUND(total,2) AS total, u.company " +
						"FROM offers o JOIN users u ON o.user_id = u.id " +
						"WHERE proposal_id = UNHEX(?) AND o.status = 1 GROUP BY o.user_id ";

						return connection.execute(query, [req.params.proposal_id]);
					}), using(getConnection(), connection => {
						var query = "SELECT HEX(o.user_id) AS user_id, HEX(o.proposal_id) AS proposal_id, o.status, " +
						"u.company, u.picture AS picture, o.created_at " +
						"FROM offers o JOIN users u ON o.user_id = u.id " +
						"WHERE proposal_id = UNHEX(?) AND o.status = 0";
						return connection.execute(query, [req.params.proposal_id]);
					}), using(getConnection(), connection => {

						var query = "CALL genEG(UNHEX(?));";

						return connection.execute(query, [req.params.proposal_id]);
					}), (applications, leads, EGcost) => {
						var data = {};
						data.applications = applications[0];
						data.leads = leads[0];
						data.EGmachines = EGcost[0][1];
						data.EGlabors = EGcost[0][0];
						data.EGmaterials = EGcost[0][2];
						callback(false, data);
					})
					.catch(err => {
						console.log(err)
						callback({status: 400, message: "Please contact an admin."})
					});
				}
			});
		},
		show: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else {
					Promise.join(using(getConnection(), connection => {
						var query = "SELECT offers.*, HEX(offers.user_id) AS offer_user_id, HEX(offers.proposal_id) " +
						"AS proposal_id, proposals.*, HEX(proposals.user_id) AS proposal_user_id, company, offers.status AS status FROM " +
						"offers LEFT JOIN users ON user_id = id LEFT JOIN " +
						"proposals ON proposal_id = proposals.id WHERE proposals.id = UNHEX(?) AND offers.user_id = " +
						"UNHEX(?) AND (offers.user_id = UNHEX(?) OR proposals.user_id = UNHEX(?)) LIMIT 1";
						return connection.execute(query, [req.params.proposal_id, req.params.user_id, payload.id, payload.id]);
					}), using(getConnection(), connection => {
						var query = "SELECT * FROM files WHERE proposal_id = UNHEX(?)";
						return connection.execute(query, [req.params.proposal_id]);
					}), using(getConnection(), connection => {
						var query = "SELECT * FROM materials WHERE proposal_id = UNHEX(?) AND user_id = UNHEX(?)";
						return connection.execute(query, [req.params.proposal_id, req.params.user_id]);
					}), using(getConnection(), connection => {
						var query = "SELECT * FROM labors WHERE proposal_id = UNHEX(?) AND user_id = UNHEX(?)";
						return connection.execute(query, [req.params.proposal_id, req.params.user_id]);
					}), (offer, files, materials, labors) => {
						if (offer[0].length == 0)
							throw {status: 400, message: "Could not find offer."};
						else {
							var data = offer[0][0];
							data.files = files[0];
							for (var i =0; i < data.files.length; i++) {
								data.files[i].filename = bucket1.getUrl('GET', `/testfolder/${data.files[i].filename}`, 'ronintestbucket', 2);
							}
							data.materials = materials[0];
							data.labors = labors[0];
							callback(false, data);
						}
					})
					.catch(err => {
						callback({status: 400, message: "Please contact an admin."})
					});
				}
			});
		},
		create: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else if (payload.type != 1)
					callback({status: 401, message: "Only Suppliers are allowed to create offers."});
				else
					using(getConnection(), connection => {
						var query = "SELECT status FROM proposals WHERE id = UNHEX(?) LIMIT 1";
						return connection.execute(query, [req.body.proposal_id]);
					})
					.spread((data) => {
						if (data.length == 0 || data[0].status != 0)
							throw {error: 400, message:"Could not find that proposal or it is no longer available."}
						else
							return using(getConnection(), connection => {
								var query = "INSERT INTO offers SET status = 0, proposal_id = UNHEX(?), " +
								"user_id = UNHEX(?), created_at = NOW(), updated_at = NOW()";
								return connection.execute(query, [req.body.proposal_id, payload.id]);
							});
					})
					.then(() => {
						callback(false);
					})
					.catch((err) => {
						callback({status: 400, message: "Please contact an admin."});
					});
			});
		},
		delete: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else if (payload.type != 1)
					callback({status: 401, message: "Only Suppliers are allowed to delete their offers."});
				else
					using(getConnection(), connection => {
						var query = "DELETE FROM offers WHERE proposal_id = UNHEX(?) AND user_id = UNHEX(?) AND status < 2 LIMIT 1";
						return connection.execute(query, [req.params.proposal_id, payload.id]);
					})
					.spread(data => {
						if (data.affectedRows == 0)
							throw {status: 400, message: "Could not delete offer, please contact an admin."};
						else
							callback(false);
					})
					.catch(err => {
						console.log(err);
						if (err.status)
							callback(err);
						else
							callback({status: 400, message: "Please contact an admin."});
					});
			});
		},
		nullify: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					return callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else if (payload.type != 0)
					return callback({status: 401, message: "Only the Maker is allowed to remove offers."});
				else
					using(getConnection(), connection => {
						var query = "SELECT HEX(user_id) AS user_id FROM proposals where id = UNHEX(?)";
						return connection.execute(query, [req.body.proposal_id]);
					})
					.spread((data) => {
						if (data[0].user_id != payload.id)
							return callback({status: 400, message: "Please contact an admin."});
						else {
							return using(getConnection(), connection => {
								var query = "UPDATE offers SET status = -1 WHERE user_id = UNHEX(?) AND proposal_id = UNHEX(?)";
								return connection.execute(query, [req.body.user_id, req.body.proposal_id]);
							})
						}
					})
					.spread((data) => {
						if (data.changedRows == 0)
							throw {status: 400, message: "Unable to remove lead. Please contact an admin."}
						else
							return using(getConnection(), connection => {
								var query = "SELECT HEX(o.user_id) AS user_id, HEX(o.proposal_id) AS proposal_id, o.status, u.company, o.created_at " +
								"FROM offers o JOIN users u ON o.user_id = u.id " +
								"WHERE proposal_id = UNHEX(?) AND o.status = 0";
								return connection.execute(query, [req.body.proposal_id]);
							})
					})
					.spread((data) => {
						callback(false, data);
					})
					.catch(err => {
						callback({status: 400, message: "Please contact an admin."});
					});
			});
		},
		send: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					return callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else if (payload.type != 1)
					return callback({status: 401, message: "Only Suppliers are allowed to send offers."});
				// Validate materials:
				for (var i = 0; i < req.body.materials.length; i++) {
					var material = req.body.materials[i];
					if (!material.material || material.weight === undefined || material.cost === undefined ||
						material.weight < 0 || material.cost < 0 ||
						parseFloat(material.weight) == NaN || parseFloat(material.cost) == NaN)
						return callback({status: 400, message: "Invalid field(s) for materials provided."});
				}

				// Validate machines:
				console.log(req.body.machines)
				for (var i = 0; i < req.body.machines.length; i++) {
					var machine = req.body.machines[i];
					console.log(machine)
					if (!machine.labor || machine.time === undefined || machine.rate === undefined ||
						machine.yield === undefined || machine.count === undefined || machine.time < 1 ||
						machine.rate < 0 || machine.yield < 0 || machine.count < 1 ||
						parseFloat(machine.rate) == NaN || parseFloat(machine.yield) == NaN ||
						parseInt(machine.count) == NaN || parseFloat(machine.time) == NaN)
						return callback({status: 400, message: "Invalid field(s) for machines provided."});
				}

				// Validate manuals:
				for (var i = 0; i < req.body.manuals.length; i++) {
					var manual = req.body.manuals[i];
					if (!manual.labor || manual.time === undefined || manual.rate === undefined ||
						manual.yield === undefined || manual.count === undefined || manual.time < 1 ||
						manual.rate < 0.01 || manual.yield < 0.01 || manual.count < 1 ||
						parseFloat(manual.time) == NaN || parseFloat(manual.rate) == NaN ||
						parseFloat(manual.yield) == NaN || parseInt(manual.count) == NaN)
						return callback({status: 400, message: "Invalid field(s) for manual labors provided."});
				}

				// Validate offer:
				if (!req.body.proposal_id ||  req.body.first === undefined || req.body.follow === undefined ||
					req.body.cavitation === undefined ||  req.body.days === undefined || req.body.life === undefined ||
					req.body.sga === undefined || req.body.profit === undefined || req.body.overhead === undefined ||
					req.body.tpp === undefined || req.body.total === undefined || req.body.completion === undefined ||
					req.body.first < 0 || req.body.follow < 0 || req.body.cavitation < 0 || req.body.days < 0 ||
					req.body.life < 0 || req.body.sga < 0  || req.body.profit < 0 || req.body.overhead < 0 || req.body.tpp < 0 ||
					req.body.total < 0 || parseFloat(req.body.first) == NaN || parseFloat(req.body.follow) == NaN ||
					parseFloat(req.body.cavitation) == NaN || parseInt(req.body.days) == NaN ||
					parseFloat(req.body.life) == NaN || parseFloat(req.body.sga) == NaN || parseFloat(req.body.profit) == NaN ||
					parseFloat(req.body.overhead) == NaN || parseFloat(req.body.tpp) == NaN || parseFloat(req.body.total) == NaN)
					return callback({status: 400, message: "Invalid form fields."});

				// Validation done, insert into offers:
				else
					using(getConnection(), connection => {
						var data = [req.body.first, req.body.follow, req.body.cavitation, req.body.days, req.body.life,
						req.body.sga, req.body.profit, req.body.overhead, req.body.tpp,
						req.body.total, req.body.completion, req.body.proposal_id, payload.id, req.body.proposal_id];
						var query = "UPDATE offers SET status = 1, first = ?, follow = ?, cavitation = ?, days = ?, life = ?, " +
						"sga = ?, profit = ?, overhead = ?, tpp = ?, " +
						"total = ?, completion = ?, updated_at = NOW() WHERE proposal_id = UNHEX(?) AND user_id = UNHEX(?) " +
						"AND status = 0 AND EXISTS (SELECT * FROM proposals WHERE id = UNHEX(?) AND status = 0 " +
						"LIMIT 1) LIMIT 1";
						return connection.execute(query, data);
					})
					.spread((data) => {
						if (data.changedRows == 0)
							throw {status: 400, message: "Unable to save your offer. Please contact an admin."}
						else
							return Promise.join(using(getConnection(), connection => {
								if (req.body.materials.length == 0)
									return;

								// Insert materials:
								var data = [];
								for (var i = 0; i < req.body.materials.length; i++) {
									var material = req.body.materials[i];
									data.push(["UNHEX(REPLACE(UUID(), '-', ''))", material.material, material.weight,
										material.cost, "NOW()", "NOW()", `UNHEX('${req.body.proposal_id}')`, `UNHEX('${payload.id}')`]);
								}
								var query = "INSERT INTO materials (id, material, weight, cost, created_at, " +
								"updated_at, proposal_id, user_id) VALUES ?";
								return connection.query(query, [data]);
							}), using(getConnection(), connection => {
								if (req.body.machines.length == 0)
									return;

								// Insert machines:
								var data = [];
								for (var i = 0; i < req.body.machines.length; i++) {
									var machine = req.body.machines[i];
									data.push(["UNHEX(REPLACE(UUID(), '-', ''))", 0, machine.labor, machine.time,
										machine.yield, machine.rate, machine.count, "NOW()", "NOW()",
										`UNHEX('${req.body.proposal_id}')`, `UNHEX('${payload.id}')`]);
								}
								var query = "INSERT INTO labors (id, type, labor, time, yield, rate, " +
								"count, created_at, updated_at, proposal_id, user_id) VALUES ?"
								return connection.query(query, [data]);
							}), using(getConnection(), connection => {
								if (req.body.manuals.length == 0)
									return;

								// Insert manuals:
								var data = [];
								for (var i = 0; i < req.body.manuals.length; i++) {
									var manual = req.body.manuals[i];
									data.push(["UNHEX(REPLACE(UUID(), '-', ''))", 1, manual.labor, manual.time,
										manual.yield, manual.rate, manual.count, "NOW()", "NOW()",
										`UNHEX('${req.body.proposal_id}')`, `UNHEX('${payload.id}')`]);
								}
								var query = "INSERT INTO labors (id, type, labor, time, yield, rate, " +
								"count, created_at, updated_at, proposal_id, user_id) VALUES ?"
								return connection.query(query, [data]);
						}))
					})
					.spread(() => {
						return using(getConnection(), connection => {
							var query = "SELECT company FROM users WHERE id IN (SELECT user_id FROM proposals WHERE id = UNHEX(?))";

							return connection.execute(query, [req.body.proposal_id]);
						})
					})
					.spread((data) => {
						// data = company name
						callback(false);
					})
					.catch(err => {
						console.log(err);
						callback({status: 400, message: "Please contact an admin."});
					});
			});
		},
		accept: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					return callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else if (payload.type != 0)
					callback({status: 400, message: "Only Makers are allowed to accept offers."});
				else if (!req.body.proposal_id || !req.body.user_id)
					callback({status: 400, message: "Invalid offer details."});
				else
					using(getConnection(), connection => {
						var query = "UPDATE proposals SET status = 2, updated_at = NOW() WHERE id = UNHEX(?) " +
						"AND user_id = UNHEX(?) AND status = 0 LIMIT 1";
						return connection.execute(query, [req.body.proposal_id, payload.id]);
					})
					.spread((data) => {
						if (data.changedRows == 0)
							throw {status: 400, message:"Unable to update your proposal status. Please contact an admin."};
						else
							return Promise.join(using(getConnection(), connection => {
								var query = "UPDATE offers SET status = 2, updated_at = NOW() WHERE proposal_id = UNHEX(?) " +
								"AND user_id = UNHEX(?) AND status = 1 LIMIT 1";
								return connection.execute(query, [req.body.proposal_id, req.body.user_id]);
							}), using(getConnection(), connection => {
								var query = "UPDATE offers SET status = -1, updated_at = NOW() WHERE proposal_id = UNHEX(?) " +
								"AND user_id != UNHEX(?)";
								return connection.execute(query, [req.body.proposal_id, req.body.user_id]);
							}), (data) => {
								callback(false);
							});
					})
					.catch(err => {
						callback({status: 400, message: "Please contact an admin."});
					});
			});
		}
	}
};
