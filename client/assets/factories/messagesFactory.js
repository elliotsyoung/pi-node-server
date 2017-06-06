app.factory('messagesFactory', function($http, $cookies) {
	return {
		// index: function(callback) {
		// 	$http.get('/messages', {
		// 		headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
		// 	}).then(function(res) {
		// 		callback(res.data);
		// 	}, function(res) {
		// 		callback(res);
		// 	});
		// },
		show: function(proposal_id, callback) {
			$http.get(`/api/messages/${proposal_id}`, {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				callback(res.data);
			}, function(res) {
				callback(res);
			});
		},
		create: function(data, callback) {
			$http.post('/api/messages', data, {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				callback(res.data);
			}, function(res) {
				callback(res);
			});
		},
		contactAdmin: function(data, callback){
			$http.post('/api/users/sendTicket', data, {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res){
				callback(res.data);
			}, function(res){
				callback(res);
			});
		}
	}
});
