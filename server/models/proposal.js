var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var using = Promise.using;
var getConnection = require("../config/mysql");
var jwt = require("jsonwebtoken");
var uuid = require("uuid/v1");
var aws = require("aws-sdk");
aws.config.update({
accessKeyId: "AKIAIFF4LTNLXH75IA2A",
secretAccessKey: "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",
region: "us-west-1"
});
var s3 = new aws.S3();
var sig = require('amazon-s3-url-signer');
var bucket1 = sig.urlSigner('AKIAIFF4LTNLXH75IA2A', 'cH6vNKd7/jsdglxOrNpLm5SkMLsVRclFiuOumtrF', {
	host : 's3-us-west-1.amazonaws.com'
});
//EXAMPLE OF USING URL SIGNER TO GET URL, GIVEN THE FILE NAME
// var filename = "GETFILENAME.extension"
// var url1 = bucket1.getUrl('GET', `/testfolder/${filename}`, 'ronintestbucket', 1);
module.exports = function(jwt_key) {
	return {
		getMyProposals: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else
					using(getConnection(), connection => {
						var query = "SELECT p.*, HEX(p.id) AS id, IFNULL(applications, 0) AS applications, IFNULL(leads, 0) AS leads, " +
						"COUNT(p.id) AS offers_count FROM proposals p " +
						"LEFT OUTER JOIN offers o ON o.proposal_id = p.id " +
						"LEFT OUTER JOIN (SELECT proposal_id, COUNT(*) AS applications FROM offers WHERE status = 1 GROUP BY proposal_id) a " +
						"ON a.proposal_id = p.id " +
						"LEFT OUTER JOIN (SELECT proposal_id, COUNT(*) AS leads FROM offers WHERE status = 0 GROUP BY proposal_id) l " +
						"ON l.proposal_id = p.id " +
						"WHERE p.user_id = UNHEX(?) AND p.status != 2 GROUP BY p.id"
						return connection.execute(query, [payload.id]);
					})
					.spread(data => {
						callback(false, data);
					})
					.catch(err => {
						callback({status: 400, message: "Please contact an admin."});
					});
			});
		},
		getMyApplications: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else
					using(getConnection(), connection => {
						var query = "SELECT *, HEX(id) AS id FROM proposals WHERE id IN (SELECT proposal_id FROM offers WHERE user_id = UNHEX(?) AND status > 0)"
						return connection.execute(query, [payload.id]);
					})
					.spread(data => {
						callback(false, data);
					})
					.catch(err => {
						callback({status: 400, message: "Please contact an admin."});
					});
			});
		},
		getPercentCompleted: function(req, callback) { //called in the tracking page to get all proposals and their percentage completed. Makers should be able to track
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else
					Promise.join(using(getConnection(), connection => {
						var user_id;
						if (payload.type == 0)
							user_id = "offers.user_id ";
						else if (payload.type == 1)
							user_id = "proposals.user_id ";
						var query = "SELECT proposals.*, offers.*, proposals.completion AS completion, picture, HEX(proposals.id) AS proposal_id, " +
						"HEX(offers.user_id) AS user_id " +
						"FROM proposals LEFT JOIN offers ON id = proposal_id LEFT JOIN users ON users.id = " + user_id +
						"WHERE (offers.user_id = UNHEX(?) OR proposals.user_id = UNHEX(?)) " +
						"AND offers.status > 1 AND proposals.status > 1";
						return connection.execute(query, [payload.id, payload.id]);
					}), using(getConnection(), connection => {
						var query = "SELECT HEX(proposal_id) AS proposal_id, SUM(output) AS completed FROM reports " +
						"WHERE (user_id = UNHEX(?) OR proposal_id IN (" +
						"SELECT id FROM proposals WHERE user_id = UNHEX(?))) GROUP BY proposal_id";
						return connection.execute(query, [payload.id, payload.id]);
					}), (proposals, reports) => {
						var response = {};
						response.proposals = proposals[0];
						response.reports = reports[0];
						callback(false, response);
					})
					.catch(err => {
						console.log(err);
						callback({status: 400, message: "Please contact an admin."});
					});
			});
		},
		uploadFiles: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err) {
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				} else if (req.files.length < 1) {
					callback({status: 400, message: "No files were selected to upload."});
				}	else if (req.files[req.files.length - 1].mimetype != "application/pdf" && !req.body.defaultNDA) {
					callback({status:400, message: "NDA must must be in .pdf format."});
				} else {
					var files = [];
					Promise.map(req.files, function(file) {
						return fs.readFileAsync(file.path)
						.then(data => {
							return new Promise((resolve, reject) => {
								s3.upload({
									Bucket: "ronintestbucket/testfolder",
									Key: file.filename,
									Body: data,
									ContentType: file.mimetype,
									ACL: "private"
								}, function(err, success) {
									if (err)
										reject(err);
									else
										resolve();
								})
							});
						})
						.then(() => {
							return fs.unlinkAsync(file.path); //removes the file from the uploads folder in the root directory
						})
						.then(() => {
							if (file.filename == req.files[req.files.length - 1].filename && !req.body.defaultNDA) //if we are looking at the last file that was uploaded and the user did not decide to use the default NDA, mark the file as type 1 (NDA) and push it to the files array.
								files.push({type: 1, filename: file.filename});
							else
								files.push({type: 0, filename: file.filename});
						})
						.catch(err => {
							throw err;
						})
					})
					.then(() => {
						callback(false, files)
					})
					.catch(err => {
						console.log(err);
						callback({status: 400, message: "Internal error, please contact an admin."});
					});
				}
			});
		},
		getProposalsForPage: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else if (payload.type != 1)
					callback({status: 400, message: "Only Suppliers may view all proposals."});
				else
					using(getConnection(), connection => {
						var query = "SELECT process FROM user_processes WHERE user_id = UNHEX(?)";
						return connection.execute(query, [payload.id]);
					})
					.spread(data => {
						return using(getConnection(), connection => {
							var _data = []
							for (var i = 0; i < data.length; i++)
								_data.push(data[i].process);
							var query = "SELECT id, zip, quantity, completion, info, GROUP_CONCAT(process SEPARATOR ', ') AS processes, " +
							"HEX(proposals.id) AS id, proposals.created_at AS created_at " +
							"FROM proposals " +
							"LEFT JOIN proposal_processes ON proposals.id = proposal_id " +
							"WHERE proposals.status = 0 AND (audience = 0 OR process IN " +
							"(?)) GROUP BY proposals.id " +
							"ORDER BY proposals.created_at DESC LIMIT ?, 11";
							return connection.query(query, [_data, (req.params.page-1)*10]);
						});
					})
					.spread(data => {
						console.log(data);
						callback(false, data);
					})
					.catch(err => {
						console.log(err);
						callback({status: 400, message: "Please contact an admin."});
					});
			});
		},
		show: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else {
					Promise.join(using(getConnection(), connection => {
						var query = "SELECT *, HEX(id) AS id, HEX(user_id) AS user_id FROM proposals LEFT JOIN files " +
						"ON id = proposal_id WHERE id = UNHEX(?)";
						return connection.execute(query, [req.params.id]);
					}), using(getConnection(), connection => {
						if (payload.type == 1) {
							var query = "SELECT * FROM offers WHERE proposal_id = UNHEX(?) " +
							"AND user_id = UNHEX(?) LIMIT 1";
							return connection.execute(query, [req.params.id, payload.id]);
						}
						else
							return [[]];
					}), (files, offer) => {
						if (files[0].length == 0 || (payload.type == 0 && payload.id != files[0][0].user_id) ||
							(payload.type == 1 && offer[0].length > 0 && offer[0][0].status < 0))
							throw {status: 400, message: "Could not find valid proposal."};
						else if (payload.type == 1 && offer[0].length == 0) {
							// Remove private files:
							for (var i = files[0].length - 1; i >= 0; i--) {
								if (files[0][i].type == 0){
									if (files[0].length == 1){ //if there is only one file, we can assume that they did not upload an NDA. The code below will keep splicing out non NDA files until only one file is left. We will replace the filename of this to the NDA and change it's type to 1. We do this because the row has important information about the proposal paired to it.
										files[0][0].filename = 'https://s3-us-west-1.amazonaws.com/ronintestbucket/public_assets/170128_Mutual_NDA.pdf'
										files[0][0].type = 1;
									}
									else
										files[0].splice(i, 1); //the files array will be shortened one document at a time until the NDA is reached. if the last file is not of type 1 (NDA), then the if statement above will convert the document into the default NDA.
								}
							}
							//Clear out confidential information
							files[0][0].user_id="";
							files[0][0].proposal_id="";
							files[0][0].zip="";
							files[0][0].info="";
							files[0][0].id="";

						}
						// Rename files:
						for (var i = 0; i < files[0].length; i++){
							if(files[0][i].filename != 'https://s3-us-west-1.amazonaws.com/ronintestbucket/public_assets/170128_Mutual_NDA.pdf'){ //sign all files inside of the files array if they are not the default nda
								files[0][i].filename = bucket1.getUrl('GET', `/testfolder/${files[0][i].filename}`, 'ronintestbucket', 10);
							}
						}

						callback(false, {files: files[0], offer: offer[0][0]});
					})
					.catch(err => {
						console.log(err);
						if (err.status)
							callback(err);
						else
							callback({status: 400, message: "Please contact an admin."});
					});
				}
			});
		},
		create: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else if (payload.type != 0)
					callback({status: 400, message: "Only Makers may create proposals."});
				else if (!req.body.processes || !req.body.product || !req.body.quantity || !req.body.completion ||
				!req.body.zip || req.body.audience === null)
					callback({status: 400, message: "All form fields are required."});
				else if (req.body.quantity < 1)
					callback({status: 400, message: "You must specify a quantity of at least 1."});
				else if (req.body.audience != 0 && req.body.audience != 1)
					callback({status: 400, message: "Invalid target suppliers provided."});
				else {
					var proposal_id = uuid().replace(/\-/g, "");
					req.body.product = req.body.product.replace(/\'/g, "''");
					req.body.info = req.body.info.replace(/\'/g, "''");
					using(getConnection(), connection => {
						var completion = req.body.completion.slice(0,10);
						var data = [proposal_id, 0, req.body.product, req.body.quantity, completion,
						req.body.zip, req.body.audience, req.body.info, payload.id];
						var query = "INSERT INTO proposals SET id = UNHEX(?), status = ?, product = ?, quantity = ?, " +
						"completion = ?, zip = ?, audience = ?, info = ?, created_at = NOW(), updated_at = NOW(), " +
						"user_id = UNHEX(?)";
						return connection.query(query, data);
					})
					.then(() => {
						return Promise.join(using(getConnection(), connection => {
							var data = [];
							for (var i = 0; i < req.body.processes.length; i++)
								data.push([req.body.processes[i], `UNHEX('${proposal_id}')`, "NOW()", "NOW()"]);
							var query = "INSERT INTO proposal_processes (process, proposal_id, " +
							"created_at, updated_at) VALUES ?";
							return connection.query(query, [data]);
						}), using(getConnection(), connection => {
							var data = [];
							for (var i = 0; i < req.body.files.length; i++) {
								var file = req.body.files[i];
								data.push([file.filename, file.type, "NOW()", "NOW()", `UNHEX('${proposal_id}')`]);
							}
							var query = "INSERT INTO files (filename, type, created_at, updated_at, " +
							"proposal_id) VALUES ?";
							return connection.query(query, [data]);
						}), () => {
							callback(false);
						});
					})
					.catch(err => {
						console.log(err)
						callback({status: 400, message: "Please contact an admin."});
					});
				}
			});
		},
		delete: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else if (payload.type != 0)
					callback({status: 400, message: "Only Makers may delete their proposals."});
				else {
					using(getConnection(), connection => {
						var query = "DELETE FROM proposals WHERE id = UNHEX(?) AND user_id = UNHEX(?) AND STATUS = 0 LIMIT 1";
						return connection.execute(query, [req.params.id, payload.id]);
					})
					.spread(data => {
						if (data.affectedRows == 0)
							throw {status: 400, message: "Could not delete proposal, please contact an admin."};
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
	}
};
