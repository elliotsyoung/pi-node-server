app.controller("registerController", function ($scope, $interval, $location, $routeParams, usersFactory) {
	if ($scope.id)
		$location.url("/");
	else {
		$scope.new_user = {};
		if ($routeParams.type == "maker")
			$scope.new_user.type = 0;
		else if ($routeParams.type == "supplier")
			$scope.new_user.type = 1;
	}

	$scope.register = function() {
		$scope.error = null;
		if (IN.User && IN.User.isAuthorized())
			return registerLinkedIn($scope.new_user);
		if ($scope.new_user.password != $scope.new_user.confirm_password)
			$scope.error = "Passwords do not match."
		else
			usersFactory.register($scope.new_user, function(data) {
				if (data.status == 401)
					$scope.logout();
				else if (data.status >= 300)
					$scope.error = data.data.message;
				else
					$location.url('/success');
			});
	};

	function registerLinkedIn(new_user){
		IN.API.Raw('/people/~:(id,first-name,last-name,email-address)?format=json').result(function(data){
			if ($scope.new_user.email == data.emailAddress){
				usersFactory.registerLinkedIn($scope.new_user, function(data){
					if (data.status == 401)
						$scope.logout();
					else if (data.status >= 300)
						$scope.error = data.data.message;
					else
						$location.url('/success');
				});
			} else {
				$scope.error = "Email is not LinkedIn Email"
				$scope.$apply();
			}
		});
	};

	function fillForm(){
		IN.User.authorize(function(){
			IN.API.Raw('/people/~:(id,first-name,last-name,email-address)?format=json').result(function(data){
				$scope.new_user.contact = `${data.firstName} ${data.lastName}`;
				$scope.new_user.email = data.emailAddress;
				$scope.$apply();
			});
		});
	};

	$scope.isAuthorized = function(){
		if(IN.User && IN.User.isAuthorized())
			return true;
		else
			return false;
	};

	$scope.linkedInLogin = function(){
		if (!IN.User.isAuthorized()) {
			IN.User.authorize(fillForm);
	  } else {
	    fillForm();
	  }
	};
});
