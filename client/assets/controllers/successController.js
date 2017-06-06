app.controller("successController", function ($scope, $location, sessionFactory) {
	if ($scope.type == 0)
		$location.url("/dashboard");
	else if ($scope.type == 1)
		$location.url("/open-proposals");
	else
		sessionFactory.setUser(true);
});
