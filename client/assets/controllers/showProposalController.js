app.controller('showProposalController', function ($scope, $location, $route, $routeParams, $sce, $anchorScroll,
	proposalsFactory, offersFactory, routesFactory) {
	if ($scope.id) {
		proposalsFactory.show($routeParams.id, function(data) {
			if (data.status == 401)
				$scope.logout();
			else if (data.status >= 300)
				$location.url("/");
			else {
				if ($scope.type == 1 && !data.offer) {
					$scope.signed = false;
				}
				else {
					$scope.signed = true;
				}
				$scope.offer = data.offer;
				$scope.proposal = data.files[0];
				console.log(data);
				$scope.files = [];
				for (var i = 0; i < data.files.length; i++) {
					if (data.files[i].type == 1)
						$scope.ndasource = $sce.trustAsResourceUrl(data.files[i].filename)
					else
						$scope.files.push(data.files[i])
				}
			}
		});
	}
	else
		$location.url('/');

	$scope.send = function() {
		if (!$scope.signed) {
			$(".ndaWindow").modal('show');
		}
		else
			$location.url(`create-offer/${$routeParams.id}`)
	}

	$scope.create = function() {
		$('#ndaWindow').modal('hide');
		offersFactory.create({proposal_id: $routeParams.id}, function(data) {
			if (data.status == 401)
				$scope.logout();
			else if (data.status >= 300)
				console.log("error:", data.data.message)
			else{
				$route.reload();
				// using $location does not update the page with the new files
				// $location.url(`/show-proposal/${$routeParams.id}`);
			}
		});
	}

	$scope.returnTrustedURL = function(file){
		console.log(file.filename);
		return $sce.trustAsResourceUrl(file.filename)
	}

	$scope.goBack = function(){
		routesFactory.goBack();
	};


	// Removing elements from DOM in angular causes errors
	// removeDuplicateModals()
}) //end of showProposalController
