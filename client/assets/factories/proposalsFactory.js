app.factory('proposalsFactory', function($http, $cookies) {
	return {
		getMyProposals: function(callback) {
			$http.get('/api/proposals/getMyProposals', {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				callback(res.data);
			}, function(res) {
				callback(res);
			});
		},
		getMyApplications: function(callback) {
			$http.get('/api/proposals/getMyApplications', {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				callback(res.data);
			}, function(res) {
				callback(res);
			});
		},
		getPercentCompleted: function(callback) {
			$http.get('/api/proposals/getPercentCompleted', {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				callback(res.data);
			}, function(res) {
				callback(res);
			});
		},
		getProposalsForPage: function(page, callback) {
			$http.get(`/api/proposals/getProposalsForPage/${page}`, {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				callback(res.data);
			}, function(res) {
				callback(res);
			});
		},
		show: function(id, callback) {
			$http.get(`/api/proposals/${id}`, {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				callback(res.data);
			}, function(res) {
				callback(res);
			});
		},
		create: function(data, callback) {
			$http.post(`/api/proposals`, data, {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				callback(res.data);
			}, function(res) {
				callback(res);
			});
		},
		delete: function(id, callback) {
			$http.delete(`/api/proposals/${id}`, {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				callback(res.data);
			}, function(res) {
				callback(res);
			});
		}
	}
})
