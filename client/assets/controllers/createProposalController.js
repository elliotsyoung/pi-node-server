app.controller("createProposalController", function ($scope, $route, $location, proposalsFactory) {
	if ($scope.type == 0) {
		$scope.today = new Date();
		$scope.documentsCount = 0;
		$scope.proposal = {info: ""};
		$scope.step = 1;
	}
	else
		$location.url("/");

	//AUTOCOMPLETE FIELDS FOR TESTING PURPOSES
	// $scope.proposal.product = $scope.company + "'s product";
	// $scope.proposal.quantity = 10000;
	// $scope.proposal.completion = new Date("2017-09-19T19:49:21+04:00");
	// // $scope.proposal.zip = 95129;
	$scope.proposal.audience = 0;
	$scope.defaultNDA = true;
	// $scope.logVariables = function(){
	// }

	//END OF AUTOCOMPLETE FIELDS FOR TESTING PURPOSES

	$scope.checkAudience = function(value){
		$scope.proposal.audience = value;
	}

	$scope.log = function(){
		console.log($scope.proposal);
		var temp2 = $scope.proposal.info.replace(/(?:\r\n|\r|\n)/g, '<br />');
		console.log(temp2);
	}
	$scope.uploadingFiles = false;

	$scope.close = function(_) {
		$(".proposalSuccess").modal('hide');
		if (_ == 0)
			$route.reload();
		else
			$location.url("/dashboard");
	};


	$scope.uploadFiles = function(){
		$scope.uploadingFiles = true;
		var formData = new FormData();
		for (var i = 0; i < document.getElementById('documentsInput').files.length; i++) {
			formData.append("file", document.getElementById('documentsInput').files[i])
		}

		if(document.getElementById('ndaInput').files[0] == undefined || $scope.defaultNDA){
			formData.append("defaultNDA", true)
		}else{
			for (var i = 0; i < document.getElementById('ndaInput').files.length; i++) {
				formData.append("file", document.getElementById('ndaInput').files[i])
			}
		}

		var request = new XMLHttpRequest();
		request.open("POST", "/uploadFiles");
		request.onload = function() {
			var responseText = JSON.parse(this.responseText);
			var response = JSON.parse(this.response);

			if (!response.message) {
				$scope.proposal.files = responseText;
				$scope.$apply();
				$scope.create();
			} else {
				$scope.error = response.message;
				$scope.uploadingFiles = false;
				$scope.$apply();
			}
		}
		request.send(formData);
	}

	$scope.create = function() {
		$scope.proposal.completion = $scope.proposal.completion = $("#completion").datepicker("getDate");
		$scope.proposal.info = $scope.proposal.info.replace(/(?:\r\n|\r|\n)/g, '<br />');
		proposalsFactory.create($scope.proposal, function(data) {
			if (data.status == 401)
				$scope.logout();
			else if (data.status >= 300){
				$scope.error = data.data.message;
				console.log($scope.error);
				$scope.uploadingFiles = false;
			}
			else {
				$scope.step = 4
				$("#proposalSuccess").modal('show');
			}
		});
	};
	function closeAllModals(modal){
		for(var i=0;i<modal.length;i++){
			modal[i].modal('hide');
		}
	}
})
