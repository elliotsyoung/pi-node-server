app.controller('openProposalsController', function ($scope, $location, $routeParams, $anchorScroll, proposalsFactory, routesFactory) {
	if ($scope.type == 1) {
		$scope.tab = "open";
		$scope.sortExpression = 'created_at';
		$scope.sortOrder = 'reverse';

		if ($routeParams.page > 0)
			$scope.page = parseInt($routeParams.page);
		else
			$scope.page = 1;

		proposalsFactory.getProposalsForPage($scope.page, function(data) {
			console.log(data);
			if (data.status == 401)
				$scope.logout();
			else if (data.status >= 300)
				console.log("error:", data.data.message)
			else {
				console.log(data);
				$scope.proposals = data;
				if ($routeParams.page)
					$anchorScroll("anchor_header");
			}
		});
	}
	else
		$location.url('/');

	$scope.showProposal = function(proposal_id){
		routesFactory.setOrigin("/open-proposals");
		$location.url(`/show-proposal/${proposal_id}`);
	};
})
