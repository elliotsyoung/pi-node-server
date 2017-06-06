var Promise = require("bluebird");
var using = Promise.using;
var getConnection = require("../config/mysql");
var jwt = require('jsonwebtoken');

module.exports = function(jwt_key) {
	return {
		set: function(req, callback) {
			jwt.verify(req.cookies.evergreen_token, jwt_key, function(err, payload) {
				if (err)
					callback({status: 401, message: "Invalid token. Your session is ending, please login again."});
				else if (payload.type != 1)
					callback({status: 400, message: "Only Suppliers may set processes."});
				else
					using(getConnection(), connection => {
						var data = [];
						for (var key in req.body)
							if (req.body.hasOwnProperty(key) && req.body[key])
								data.push([key, `UNHEX('${payload.id}')`, "NOW()", "NOW()"]);

						var query = "INSERT INTO user_processes (process, user_id, created_at, updated_at) VALUES ?";
						return connection.query(query, [data]);
					})
					.then(() => {
						callback(false);
					})
					.catch(err => {
						callback({status: 400, message: "Please contact an admin."});
					});
			});
		}
	}
};
