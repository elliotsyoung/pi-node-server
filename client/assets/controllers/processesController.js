app.controller('processesController', function ($scope, $location, processesFactory) {
	if ($scope.type != 1)
		$location.url('/');

	$scope.setProcesses = function() {
		processesFactory.set($scope.process, function(data) {
			if (data.status == 401)
				$scope.logout();
			else if (data.status >= 300)
				console.log("error:", data.data.message)
			else
				$location.url('/open-proposals');
		});
	}
});
