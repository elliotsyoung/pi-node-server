app.factory('offersFactory', function($http, $cookies) {
	return {
		getOffersForProposal: function(proposal_id, callback) {
			$http.get(`/api/getOffersForProposal/${proposal_id}`, {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				callback(res.data);
			}, function(res) {
				callback(res);
			});
		},
		getAcceptedOffers: function(callback) {
			$http.get('/api/getAcceptedOffers', {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				callback(res.data);
			}, function(res) {
				callback(res);
			});
		},
		getOffers: function(callback) {
			$http.get('/api/getOffers', {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				callback(res.data);
			}, function(res) {
				callback(res);
			});
		},
		index: function(proposal_id, callback) {
			$http.get(`/api/offers/${proposal_id}`, {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				callback(res.data);
			}, function(res) {
				callback(res);
			});
		},
		show: function(proposal_id, user_id, callback) {
			$http.get(`/api/offer/${proposal_id}/${user_id}`, {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				callback(res.data);
			}, function(res) {
				callback(res);
			});
		},
		create: function(data, callback) {
			$http.post('/api/offers', data, {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				callback(res.data);
			}, function(res) {
				callback(res);
			});
		},
		delete: function(proposal_id, callback) {
			$http.delete(`/api/offers/${proposal_id}`, {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				callback(res.data);
			}, function(res) {
				callback(res);
			});
		},
		removeLead: function(data, callback) {
			$http.put('/api/offers/nullify', data, {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				callback(res.data);
			}, function(res) {
				callback(res);
			});
		},
		send: function(data, callback) {
			$http.put('/api/offers/send', data, {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				callback(res.data);
			}, function(res) {
				callback(res);
			});
		},
		accept: function(data, callback) {
			$http.put('/api/offers/accept', data, {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				callback(res.data);
			}, function(res) {
				callback(res);
			});
		}
	}
});
