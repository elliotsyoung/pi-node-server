app.controller('dashboardController', function ($scope, $location, $interval,
 $timeout, proposalsFactory, offersFactory, usersFactory, chartsFactory) {
	if ($scope.id) {
		$scope.tab = "dashboard";
		$scope.chartMetric = "total";

		// Makers should get all proposals they have created:
		if ($scope.type == 0) {
			proposalsFactory.getMyProposals(function(data) {
				if (data.status == 401)
					$scope.logout();
				else if (data.status >= 300){
				} else {
					$scope.proposals = data
          if(data.length > 0){
            setTimeout(function(){
              $scope.getOffersForProposal(data[0]);
              $scope.defaultProposalName = data[0].product;
            }, 1000)
          }
				}
			});
		}
		// Suppliers should get all proposals that they have applied to.
		// Information about owners of other offers are not available to suppliers.
		else {
			proposalsFactory.getMyApplications(function(data) {
				if (data.status == 401)
					$scope.logout();
				else if (data.status >= 300) {
				} else {
					$scope.proposals = data;
          if(data.length > 0){
            setTimeout(function(){
              $scope.getOffersForProposal(data[0]);
              $scope.defaultProposalName = data[0].product;
            }, 1000)
          }
				}
			});
		}
	}
	else {
		$location.url('/');
	}

	//////////////////////////////////////////////////////
	//										HELPER FUNCTIONS
	//////////////////////////////////////////////////////
	var chart;
  $scope.selected_proposal;
	function initializeChart() {
		if (angular.isDefined(chart))
			$interval.cancel(chart);

		chart = chartsFactory.getChart();
		chart.template.width = document.getElementById('chart_div').parentElement.offsetWidth - (2 * document.getElementById('chart_div').parentElement.padding);
		chart.customColorsForFirstNBars = ['#7AC200']
		chart.dataset = null;
    chart.template.metric = $scope.chartMetric
		chart.clearChartData();
		$scope.is_loaded = true;
	};

	// Make sure chart is loaded:
	if (!chartsFactory.getChart()) {
		chart = $interval(function() {
			if (chartsFactory.getChart())
				initializeChart();
		}, 100);
	}
	else
		initializeChart();

	$scope.changeChartMetricTo = function(newMetric) {
		$scope.chartMetric = newMetric;
		chart.template.metric = newMetric;
		if ($scope.offers.length>0) {
			if ($scope.type == 0) {
				organizeOffersForMaker()
			} else {
				organizeOffersForSupplier()
			}
		}

		if ($scope.offers.length>0) {
			chart.drawChart();
		}
	};

	function organizeOffersForMaker() {
		var indexOfBest = 0
    //using the yields from machines and labors, calculate a "quality" metric (total yield)
    for (var i = 0; i < $scope.offers.length; i++) {
			appendQualityEstimate($scope.offers[i]);
		}
    //Find the maximum or minimum to represent in green, depending on the metric selected
    if(chart.template.metric == 'quality'){
      for (var i = 0; i < $scope.offers.length; i++) {
        // If the selected metric is quality (total yield), we want the highest number
        // among all the offers to show up as the 'best offer':
        if (parseInt($scope.offers[i][chart.template.metric]) > parseInt($scope.offers[indexOfBest][chart.template.metric])) {
          indexOfBest = i;
        }
      }
    }else{
      for (var i = 0; i < $scope.offers.length; i++) {
        // If the selected metric is quality (total yield), we want the highest number
        // among all the offers to show up as the 'best offer':
        if (parseInt($scope.offers[i][chart.template.metric]) < parseInt($scope.offers[indexOfBest][chart.template.metric])) {
          indexOfBest = i;
        }
      }
    }
		chart.customColorsForFirstNBars = ['#7AC200'];
		chart.firstNBars = [$scope.offers[indexOfBest]];
	};

	function organizeOffersForSupplier() {
		// For suppliers, the "company" of each offer doesn't exist.
		// It is replaced with "lowest offer" or "your offer" based on the logic below.
		// This needs to be cleared when a new metric is selected.
		clearCompaniesFromOffers();

		// Depending on the metric, the best offer may be the maximum or minimum among all offers.
		// The best quality is the highest yield while the best total cost is the lowest number.
		var indexOfBest = 0;
		var smallest = $scope.offers[0][chart.template.metric]
		var indexOfSupplierViewing;
		var firstNBars = [];

		for (var i = 0; i < $scope.offers.length; i++) {
			appendQualityEstimate($scope.offers[i]);
			if ($scope.offers[i].user_id != undefined) {
				indexOfSupplierViewing = i;
			}
		}

    if(chart.template.metric == 'quality'){
      for (var i = 0; i < $scope.offers.length; i++) {
        // If the selected metric is quality (total yield), we want the highest number
        // among all the offers to show up as the 'best offer':
        if (parseInt($scope.offers[i][chart.template.metric]) > parseInt($scope.offers[indexOfBest][chart.template.metric])) {
          indexOfBest = i;
        }
      }
    }else {
      for (var i = 0; i < $scope.offers.length; i++) {
        // If the selected metric is quality (total yield), we want the highest number
        // among all the offers to show up as the 'best offer':
        if (parseInt($scope.offers[i][chart.template.metric]) < parseInt($scope.offers[indexOfBest][chart.template.metric])) {
          indexOfBest = i;
        }
      }
    }

		$scope.offers[indexOfSupplierViewing].company = "your offer";
		if (indexOfBest != indexOfSupplierViewing) {
			$scope.offers[indexOfBest].company = "best offer";
			firstNBars.push($scope.offers[indexOfSupplierViewing]);
			firstNBars.push($scope.offers[indexOfBest]);
			chart.customColorsForFirstNBars = ['#FFA500', '#7AC200'];
		} else {
			firstNBars.push($scope.offers[indexOfSupplierViewing]);
			chart.customColorsForFirstNBars = ['#7AC200'];
		}
		chart.firstNBars = firstNBars;
	};

	function clearCompaniesFromOffers() {
		for (var i = 0; i < $scope.offers.length; i++) {
			$scope.offers[i].company = "Anonymous Offer";
		}
	};

	function appendQualityEstimate(application) {
		var quality = 1;
		for (var i = 0; i < application.machines.length; i++) {
			quality *= parseInt(application.machines[i].yield) / 100
		}
		for (var i = 0; i < application.manuals.length; i++) {
			quality *= parseInt(application.manuals[i].yield) / 100;
		}
		application.quality = Math.floor(quality * 100);
	}

	//////////////////////////////////////////////////////
	//										OFFER
	//////////////////////////////////////////////////////
	$scope.getOffersForProposal = function(proposal) {
    $scope.selected_proposal = proposal; //The HTML will check to see whether the selected proposal has accepted an offer yet.
		offersFactory.getOffersForProposal(proposal.id, function(data) {
			if (data.status == 401)
				$scope.logout();
			else if (data.status >= 300) {
			} else {
				$scope.offers = data;
				chart.dataset = $scope.offers
				if ($scope.offers.length > 0) {
					if ($scope.type == 0) {
						organizeOffersForMaker()
					} else {
						organizeOffersForSupplier()
					}
          chart.template.charttitle = ""
					chart.drawChart();
					$timeout(function(){ //HOT FIX FOR CHART WIDTH RESIZING
						chart.drawChart();
					}, 100);
				}
			}
		});
	};

	//////////////////////////////////////////////////////
	//										USER
	//////////////////////////////////////////////////////
	// Available function for emailing admin:
	$scope.sendTicket = function() {
		usersFactory.sendTicket(function(data) {
			if (data.status == 401)
				$scope.logout();
			else if (data.status >= 300) {
			} else {
			}
		});
	};



});
