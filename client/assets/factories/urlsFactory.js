app.factory('urlsFactory', function($http, $cookies) {
	return {
		create: function (data, callback){
			$http.post('/api/urls', data, {
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
