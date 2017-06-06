app.controller('createOfferController', function ($rootScope, $scope, $location, $routeParams, $anchorScroll,
	proposalsFactory, offersFactory, socketsFactory) {
	if ($scope.type == 1) {
		$scope.today = new Date();
		offersFactory.show($routeParams.id, $scope.id, function(data) {
			if (data.status == 401)
				$scope.logout();
			else if (data.status >= 300)
				console.log("error:", data.data.message);
			else if (data.status < 0)
				$location.url("/open-proposals");
			else if (data.status > 0)
				$location.url(`/offer/${$routeParams.id}/${$scope.id}`);
			else if (data.status === 0) {
				$scope.offer = {
					proposal_id: $routeParams.id,
					materials: [{}],
					machines: [{}],
					manuals: [{}],
				};
				$scope.proposal = data;
			}
			else
				$location.url(`/show-proposal/${$routeParams.id}`)
		});
	}
	else
		$location.url('/');

	$scope.submit = function() {
		// Do whatever math here...
		$scope.show_summary = true;
		$scope.offer.total = $scope.offer.tpp * $scope.proposal.quantity
		$anchorScroll("anchor_summary");
	};

	$scope.edit = function() {
		$scope.show_summary = false;
		$scope.error = "";
		$anchorScroll("anchor_form");
	};

	$scope.continue = function() {
		$(".offerSent").modal("hide");
		$location.url("/open-proposals");
	};

	$scope.send = function() {
		$scope.error = "";
		offersFactory.send($scope.offer, function(data) {
			if (data.status == 401)
				$scope.logout();
			else if (data.status >= 300){
				$scope.error = data.data.message;
				console.log($scope.error);
			} else {
				console.log('proposal owner:', $scope.proposal.proposal_user_id);
				socketsFactory.emit("offer", {user_id: $scope.proposal.proposal_user_id});

				$scope.sent = true;
				$rootScope.myProposals += 1;
				$("#offerSent").modal("show");
			}
		});
	};


});
