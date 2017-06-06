var Promise = require("bluebird");
var using = Promise.using;
var getConnection = require("../config/mysql");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var fs = Promise.promisifyAll(require("fs"));
var aws = require("aws-sdk");
aws.config.update({
accessKeyId: "AKIAIFF4LTNLXH75IA2A",
secretAccessKey: "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",
region: "us-west-1"
});
var s3 = new aws.S3();
module.exports = function(jwt_key) {
	return {
		create: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else if (req.body.homepage === undefined || req.body.facebook === undefined ||
				req.body.instagram === undefined || req.body.linkedin === undefined || req.body.twitter === undefined)
					callback({status: 400, message: "Some URLS are missing from the request."})
				else
					using(getConnection(), connection => {
						// The first query determines whether or not the user has a URL record associated with their account yet.
						var query = "SELECT * FROM urls WHERE user_id = UNHEX(?) LIMIT 1";
						return connection.execute(query, [payload.id]);
					})
					.spread(data => {
						return using(getConnection(), connection => {
							var _data = [req.body.homepage, req.body.facebook, req.body.instagram,
							req.body.linkedin, req.body.twitter, payload.id];
							if (data.length == 0) {
								query = "INSERT INTO urls SET homepage = ?, facebook = ?, instagram = ?, " +
								"linkedin = ?, twitter = ?, created_at = NOW(), updated_at = NOW(), user_id = UNHEX(?)"
								return connection.execute(query, _data);
							}
							else {
								query = "UPDATE urls SET homepage = ?, facebook = ?, instagram = ?, " +
								"linkedin = ?, twitter = ?, updated_at = NOW() WHERE user_id = UNHEX(?)"
								return connection.execute(query, _data);
							}
						});
					})
					.spread(data => {
						if (data.affectedRows == 0)
							callback({status: 400, message: "Unable to save URLs."});
						else
							callback(false);
					})
					.catch(err => {
						console.log(err);
						callback({status: 400, message: "Please contact an admin."});
					});
			});
		},
		uploadPicture: function(req, callback) {
			var uploadedURL;
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err) {
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				} else if (!req.file) {
					callback({status: 400, message: "No files were selected to upload."});
				} else {
					fs.readFileAsync(req.file.path)
					.then( data => {
						return new Promise((resolve, reject) => {
							s3.upload({
								Bucket: "ronintestbucket/picturefolder",
								Key: req.file.filename,
								Body: data,
								ContentType: req.file.mimetype,
								ACL: "public-read"
							}, function(err, data) {
								if (err)
									reject(err);
								else{
									uploadedURL = data.Location
									resolve(data.Location);
								}
							})
						})
						.then((pictureURL) => {
							return using(getConnection(), connection => {
								query = "UPDATE users SET picture = ?, updated_at = NOW() WHERE id = UNHEX(?)"
								return connection.execute(query, [unescape(pictureURL), payload.id]);
							}
						);
					})
					.then(() => {
						return fs.unlinkAsync(req.file.path);
					})
					.catch(err => {
						throw err;
					})
				})
				.then(() => {
					var picture = unescape(uploadedURL);
					var evergreen_token = jwt.sign({
						id: payload.id,
						type: payload.type,
						company: payload.company,
						contact: payload.contact,
						picture: picture,
						created_at: payload.created_at
					}, jwt_key, {expiresIn: "5d"});
					callback(false, evergreen_token, picture);
				})
				.catch(err => {
					console.log(err);
					callback({status: 400, message: "Internal error, please contact an admin."});
				});
			}
		});
	},
}
};
