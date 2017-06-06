app.controller('showOfferController', function ($scope, $location, $routeParams,
	proposalsFactory, offersFactory, selectedProposalFactory, routesFactory) {
	if ($scope.id) {
		offersFactory.show($routeParams.proposal_id, $routeParams.user_id, function(data) {
			if (data.status == 401)
				$scope.logout();
			else if (data.status >= 300)
				console.log("error:", data.data.message)
			else {
				$scope.offer = data;
			}
		});
	}
	else
		$location.url('/');


	$scope.goToShowProposalPage = function(proposal_id){
		routesFactory.setOrigin(`/show-offer/${proposal_id}/${$routeParams.user_id}`);
		$location.url(`/show-proposal/${proposal_id}`);
	};


})
