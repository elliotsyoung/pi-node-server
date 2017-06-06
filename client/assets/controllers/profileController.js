app.controller('profileController', function ($scope, $location, $routeParams, $rootScope, usersFactory, urlsFactory) {
	$scope.editingURLS = false;

	if ($scope.id) {
		$scope.tab = "profile";

		// If id in URL, query backend for user:
		if ($routeParams.id) {
			$scope.viewingOtherProfile = true;
			$scope.profilerequest = $routeParams.id;
		} else {
			$scope.profilerequest = $scope.id;
		}
	}
	else {
		$location.url('/');
	}

	//////////////////////////////////////////////////////
	//										HELPER FUNCTIONS
	//////////////////////////////////////////////////////
	(requestProfile = function () {
		// We could be viewing our own profile or another company's:
		usersFactory.show($scope.profilerequest, function(data) {
			if (data.status == 401)
				$scope.logout();
			else if (data.status >= 300)
				$scope.error = data.data.message;
			else {
				$scope.this_user = data
				if ($scope.viewingOtherProfile) {
					$scope.companyprofile = data.company;
				}
			}
		});
	})();

	$scope.uploadPicture = function() {
		var request = new XMLHttpRequest();
		request.open("POST", "/uploadPicture");
		request.onload = function() {
			$rootScope.picture = JSON.parse(this.response);
			$scope.$apply();
		}

		// Use FormData object to post picture with AJAX
		var formData = new FormData();
		formData.append("picture", document.getElementById('picture').files[0]);
		request.send(formData);
	}

	//////////////////////////////////////////////////////
	//										URL
	//////////////////////////////////////////////////////
	$scope.updateURLS = function(){
		if (true) {
			urlsFactory.create($scope.this_user, function(data) {
				if (data.status == 401)
					$scope.logout();
				else if (data.status >= 300) {
					console.log($scope.error);
				} else {
					$scope.editingURLS = !$scope.editingURLS;
					requestProfile();
				}
			});
		} else {
			$scope.editingURLS = !$scope.editingURLS;
		}
	}

	$scope.httpFormat = function(url, model){
		if (url.length > 0 && url[0] != 'h'){
			url = 'http://'+ url;
			switch (model) {
				case 'homepage':
					$scope.this_user.homepage = url;
					break;
				case 'linkedin':
					$scope.this_user.linkedin = url;
					break;
				case 'facebook':
					$scope.this_user.facebook = url;
					break;
				case 'twitter':
					$scope.this_user.twitter = url;
					break;
				case 'instagram':
					$scope.this_user.instagram = url;
					break;
				default:

			}
		}
	}

});
