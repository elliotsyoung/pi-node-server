app.controller('indexController', function ($scope, $rootScope, $location, sessionFactory, usersFactory) {
	if ($scope.id) {
		$location.url('/dashboard');
	} else {
		if (IN.User && IN.User.isAuthorized()) {
			IN.User.logout(function(){
				$cookies.remove("evergreen_token");
			});
		} else {
		}
	}

	$scope.login = function() {
		$scope.error = null;
		usersFactory.login($scope.user, function(data) {
			if (data.status == 401)
				$scope.logout();
			else if (data.status >= 300)
				$scope.error = data.data.message;
			else {
				sessionFactory.setUser();
				if ($scope.type == 0)
					$location.url('/dashboard');
				else if ($scope.type == 1)
					$location.url('/open-proposals');
			}
		});
	};

	$scope.LoginLinkedIn = function(new_user) {
		IN.User.authorize(function(){
			IN.API.Raw('/people/~:(email-address)?format=json').result(function(login){
				usersFactory.loginLinkedIn({'email':login.emailAddress}, function(data) {
					if (data.status == 401)
						$scope.logout();
					else if (data.status >= 300)
						$scope.error = data.data.message;
					else {
						sessionFactory.setUser();
						if ($scope.type == 0)
							$location.url('/dashboard');
						else if ($scope.type == 1)
							$location.url('/open-proposals');
					}
				});
			});
		});
	};
});
