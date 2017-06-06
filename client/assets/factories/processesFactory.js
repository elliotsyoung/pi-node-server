app.factory('processesFactory', function($http, $cookies) {
	return {
		set: function(data, callback) {
			$http.post('/api/processes/set', data, {
				headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
			})
			.then(function(res) {
				console.log(res.data);
				callback(res.data);
			});
		}
	}
})
