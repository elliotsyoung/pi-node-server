app.controller('trackingController', function ($scope, $location, reportsFactory, proposalsFactory) {
	if ($scope.id) {
		$scope.tab = "tracking";
		$scope.show_report = false;
		$scope.today = new Date().setHours(0,0,0,0);
		$scope.reported_today = false;
		$scope.report;
		$scope.new_report = {};
		proposalsFactory.getPercentCompleted(function(data) {
			console.log(data);
			if (data.status == 401)
				$scope.logout();
			else if (data.status >= 300)
				console.log("error:", data.data.message);
			else {
				// Parse reports for faster processing:
				var completed = {};
				for (var i = 0; i < data.reports.length; i++) {

					completed[data.reports[i].proposal_id] = data.reports[i].completed;
				}

				// Set completed (percentage) for each proposal:
				for (var i = 0; i < data.proposals.length; i++) {
					if (completed[data.proposals[i].proposal_id]){
						data.proposals[i].completed = parseFloat(completed[data.proposals[i].proposal_id]*100/data.proposals[i].quantity).toFixed(1);
						data.proposals[i].quantity_completed = completed[data.proposals[i].proposal_id]
					}
					else
						data.proposals[i].completed = 0;
					// Set days left for each proposal:
					data.proposals[i].days_left = daysBetween($scope.today, data.proposals[i].completion_date);
				}

				$scope.proposals = data.proposals;
				console.log($scope.proposals);
			}
		});
	}
	else {
		$location.url('/');
	}

	//////////////////////////////////////////////////////
	//										HELPER FUNCTIONS
	//////////////////////////////////////////////////////
	function treatAsUTC(date) {
		var result = new Date(date);
		result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
		return result;
	}

	function daysBetween(startDate, endDate) {
		var millisecondsPerDay = 24 * 60 * 60 * 1000;
		return (treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay;
	}

	function assignReports(data) {
		$scope.reports = data;
		$scope.new_report.input = "";
		$scope.new_report.output = "";
		$scope.new_report.shipped = "";
		$scope.new_report.note = "";
		var builtUnits = 0;
		for (var i = 0; i < $scope.reports.length; i++){
			builtUnits += parseInt($scope.reports[i].output);
		}

		if (builtUnits < $scope.proposalView.quantity)
			$scope.finished = false;
		else
			$scope.finished = true;

	};

	// $scope.percentCompleted = function(){
	// 	return ($scope.proposal.completed/$scope.proposal.quantity);
	// }

	$scope.reportForm = function(id){
		$scope.form = {
			offer_id: id,
			input: "",
			output: "",
			shipped: "",
			note: ""
		}
		$scope.error = undefined;
	};

	$scope.showReport = function(report) {
		$scope.cur_report = report;
		$("#show-modal").modal("show");
	}

	// function formatProposalsAndReports(){
	// 	var formattedObject = [];
	// 	for(i=0;i<$scope.proposals.length;i++){
	// 		formattedObject.push($scope.proposals[i]);
	// 		formattedObject[i].reports = [];
	// 		for(j=0;j<$scope.reports.length;j++){
	// 			if(formattedObject[i].hex_proposal_id == $scope.reports[j].proposal_id){
	// 				formattedObject[i].reports.push($scope.reports[j])
	// 			}
	// 		}
	// 	}
	// 	return formattedObject;
	// }

	//////////////////////////////////////////////////////
	//										REPORT
	//////////////////////////////////////////////////////

	$scope.getReports = function(proposal) {
		if ($scope.proposalView == proposal)
			$scope.proposalView = undefined;
		else {
			$scope.proposalView = proposal;
			reportsFactory.getReportsForProposal(proposal.proposal_id, function(data) {
				if (data.status == 401)
					$scope.logout();
				else if (data.status >= 300)
					console.log("error:", data.data.message)
				else {
					if (new Date(data[data.length - 1]).setHours(0,0,0,0) == $scope.today)
						$scope.reported_today = true;
					assignReports(data);
				}
			});
		}
	};

	$scope.reportSubmit = function(){
		$scope.new_report.proposal_id = $scope.proposalView.proposal_id;
		if ($scope.proposalView.quantity >= $scope.proposalView.completed + $scope.new_report.output) {
			$('.ui.modal').modal('hide');
			reportsFactory.create($scope.new_report, function(data) {
				if (data.status == 401)
					$scope.logout();
				else if (data.status >= 300) {
					console.log("error:", data.data.message)
					$scope.error = data.data.message;
				}
				else {
					assignReports(data);
				}
			});
		} else {
			$scope.error = "You cannot report more than is required"
		}
	};


});
