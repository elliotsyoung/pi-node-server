app.factory('reportsFactory', function($http, $cookies) {
	return {
		index: function(callback) {
			$http.get('/api/reports', {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				callback(res.data);
			}, function(res) {
				callback(res);
			});
		},
		getReportsForProposal: function(proposal_id, callback) {
			$http.get(`/api/reports/getReportsForProposal/${proposal_id}`, {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				callback(res.data);
			}, function(res) {
				callback(res);
			});
		},
		// show: function(id, callback) {
		// 	$http.get(`/api/proposals/${id}`, {
		// 		headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
		// 	})
		// .then(function(res) {
		// 		callback(res.data);
		// 	}, function(res) {
		// 		callback(res);
		// 	});
		// },
		// update: function(data, callback) {
		// 	$http.put(`/api/proposals`, data, {
		// 		headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
		// 	})
		// .then(function(res) {
		// 		callback(res.data);
		// 	}, function(res) {
		// 		callback(res);
		// 	});
		// },
		// delete: function(id, callback) {
		// 	$http.delete(`/api/proposals/${id}`, {
		// 		headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
		// 	})
		// .then(function(res) {
		// 		callback(res.data);
		// 	}, function(res) {
		// 		callback(res);
		// 	});
		// },
		create: function(data, callback) {
			console.log(data);
			$http.post('/api/reports', data, {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				callback(res.data);
			}, function(res) {
				callback(res.data);
			});
		}
	}
})
