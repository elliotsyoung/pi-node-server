app.controller('proposalsController', function ($scope, $rootScope, $location, $interval, $anchorScroll,
proposalsFactory, offersFactory, socketsFactory, chartsFactory, selectedProposalFactory, routesFactory, usersFactory) {
	if ($scope.type == 0) {
		$scope.tab = "proposals";

		if ($scope.hasNewOffer) {
			usersFactory.setHasNewOffer({hasNewOffer: 0}, function(data) {
				if (data.status == 401)
					$scope.logout();
				else if (data.status >= 300)
					console.log("error:", data.data.message)
				else
					$rootScope.hasNewOffer = false;
			});
		}

		proposalsFactory.getMyProposals(function(data) {
			if (data.status == 401)
				$scope.logout();
			else if (data.status >= 300)
				console.log("error:", data.data.message)
			else {
				$scope.proposals = data;
				// $scope.selected_proposal = selectedProposalFactory.get();
				if(selectedProposalFactory.get()){
					$scope.getOffers(selectedProposalFactory.get());
					scrollToProposal(selectedProposalFactory.get().id)
				}
			}
		});

		$scope.selected_proposal = {
			completion: Date.now()
		}

		$scope.offerView = {
			total: 6295200000.00,

		}
	}
	else
		$location.url('/');

	var chart = chartsFactory.chart;

	$scope.offerView = {
		total: 0,
		company: 'placeholder company'
	}
	//////////////////////////////////////////////////////
	//										HELPER FUNCTIONS
	//////////////////////////////////////////////////////
	var chart;

	function initializeChart() {
		if (angular.isDefined(chart))
			$interval.cancel(chart);

		chart = chartsFactory.getChart();
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

	$scope.leadViewAssign = function(lead) {
		$scope.leadView = lead;
	};

	function refreshChart() {
		try {
			chart.template.metric = "total"
			chart.template.charttitle = "Comparing Offers By Total Cost"
			chart.template.width = document.getElementById('chart_div').parentElement.offsetWidth -
			(2 * document.getElementById('chart_div').parentElement.padding);
			chart.dataset = $scope.offers
			chart.firstNBars = [$scope.EGcost, $scope.offerView]
			chart.customColorsForFirstNBars = ['#7AC200','orange']
			chart.drawChart();
			$scope.$apply()
		}
		catch(err) {
			setTimeout(refreshChart,500);
		}
	};

	$scope.set = function(proposal) {
		$scope.id_to_delete = proposal.id;
	}

	//////////////////////////////////////////////////////
	//										PROPOSAL
	//////////////////////////////////////////////////////
	$scope.delete = function() {
		if ($scope.id_to_delete) {
			proposalsFactory.delete($scope.id_to_delete, function(data) {
				if (data.status == 401)
					$scope.logout();
				else if (data.status >= 300)
					console.log("error:", data.data.message)
				else {
					$scope.proposals.splice($scope.proposals.findIndex(function(proposal) {
						if (proposal.id == $scope.id_to_delete)
							return true;
					}), 1);
				}
			});
		}
	};

	//////////////////////////////////////////////////////
	//										OFFER
	//////////////////////////////////////////////////////
	$scope.getOffers = function(proposal) {
		var clickedSameProposal = false
		if($scope.selected_proposal){
			if($scope.selected_proposal.id == proposal.id) //we cannot access id if selected proposal does not exist.
				clickedSameProposal = true
		}
		$scope.proposalTab = 0;
		if (clickedSameProposal) {
				$scope.selected_proposal = undefined;
				selectedProposalFactory.set(undefined)
		}
		else {
			offersFactory.index(proposal.id, function(data) {
				console.log(data);
				if (data.status == 401)
					$scope.logout();
				else if (data.status >= 300)
					console.log("error:", data.data.message)
				else {
					$scope.selected_proposal = proposal;
					$scope.proposalOffersDetails = data;
					$scope.offers = data.applications;
					selectedProposalFactory.set(proposal);

					if(data.leads.length >= 1) {
						$scope.leads = data.leads;
						$scope.leadView = data.leads[0]
					} else {
						$scope.leads = undefined;
						$scope.leadView = undefined;
					}

					if(data.applications.length>0) {
						// $scope.EGcost = data.applications.pop();
						// NEW EG CALCULATIONS
						// ==================================================================================
						var minimumAggregateLabor = returnMinumumEGElement('offer_labor_cost', data.EGlabors);
						var minimumAggregateMachines = returnMinumumEGElement('offer_machine_cost', data.EGmachines);
						var minimumAggregateMaterials = returnMinumumEGElement('offer_material_cost', data.EGmaterials);
						var minimumSGA = returnMinimumApplicationElement('sga', data.applications)
						var minimumProfit = returnMinimumApplicationElement('profit', data.applications)
						var minimumOverhead = returnMinimumApplicationElement('overhead', data.applications)
						var EGEstimatedCostPerUnit =(minimumAggregateLabor + minimumAggregateMachines + minimumAggregateMaterials + minimumSGA + minimumProfit + minimumOverhead)
						var EGEstimatedCost = EGEstimatedCostPerUnit * $scope.selected_proposal.quantity;
						console.log('EGEstimatedCost', EGEstimatedCost);
						console.log("EGoffer", $scope.EGoffer);
						$scope.EGEstimate = EGEstimatedCost;
						$scope.EGEstimatePerUnit = EGEstimatedCostPerUnit;
						populateEGOffer();
						console.log($scope.EGoffer);
						// ==================================================================================

						$scope.offers = data.applications;
						$scope.offerView = $scope.offers[0];
						// $scope.offerView.PPU = (parseFloat($scope.offerView.total)/parseFloat($scope.selected_proposal.quantity)).toFixed(2);
						drawNewChart(data);
						refreshChart()
					} else {
						$scope.offers = undefined;
						$scope.offerView = undefined;
					// refreshChart();
				}
			}
			});
		}
	};

	function scrollToProposal(proposal_id){
		$location.hash(proposal_id)
		$anchorScroll(proposal_id);
	}

	function returnMinumumEGElement(selection, array){
		var newObj = {};
		var min;
		for( var i = 0; i < array.length; i++){
			if( !newObj.hasOwnProperty(array[i].user_id) ){
				newObj[array[i].user_id] = array[i][selection];
			} else {
				newObj[array[i].user_id] += array[i][selection];
			}
		}

		for (key in newObj) {
			if( !min || newObj[key] < min ){
				min = newObj[key];
				$scope.EGoffer[selection] = key
			}
		}
		return parseFloat(min);
	}

	function returnMinimumApplicationElement(selection, array) {
		var min = array[0][selection];
		for( var i = 1; i < array.length; i++ ){
			if( parseInt(array[i][selection]) < parseInt(min) ) {
				min = array[i][selection]
			}
		}
		$scope.EGoffer[selection] = min;
		return parseFloat(min);
	}

	function populateEGOffer(){
		clearEGofferDetails();
		for( var i = 0; i < $scope.proposalOffersDetails.EGlabors.length; i++){
			if($scope.proposalOffersDetails.EGlabors[i].user_id == $scope.EGoffer.offer_labor_cost){
				$scope.EGoffer.EGlabors.push($scope.proposalOffersDetails.EGlabors[i]);
			}
		}
		for( var i = 0; i < $scope.proposalOffersDetails.EGmaterials.length; i++){
			if($scope.proposalOffersDetails.EGmaterials[i].user_id == $scope.EGoffer.offer_material_cost){
				$scope.EGoffer.EGmaterials.push($scope.proposalOffersDetails.EGmaterials[i]);
			}
		}
		for( var i = 0; i < $scope.proposalOffersDetails.EGmachines.length; i++){
			if($scope.proposalOffersDetails.EGmachines[i].user_id == $scope.EGoffer.offer_machine_cost){
				$scope.EGoffer.EGmachines.push($scope.proposalOffersDetails.EGmachines[i]);
			}
		}
	}
	$scope.getOffer = function(offer) {
		$scope.offerView = offer;
		$scope.offerView.PPU = (parseFloat($scope.offerView.total)/parseFloat($scope.selected_proposal.quantity)).toFixed(2);
		// refreshChart();
		drawNewChart($scope.proposalOffersDetails);
		// $scope.$apply();
	};

	$scope.accept = function() {
		$scope.closeAcceptOfferModal();
		var offer = {
			proposal_id: $scope.offerView.proposal_id,
			user_id: $scope.offerView.user_id
		};
		offersFactory.accept(offer, function(data) {
			if (data.status == 401)
				$scope.logout();
			else if (data.status >= 300)
				console.log("error:", data.data.message)
			else {
				console.log('here');
				socketsFactory.emit("accept", offer);
				$location.url("/messages");
			}
		});
	};

	$scope.closeAcceptOfferModal = function() {
		$('.accept-modal').modal('hide');
	}

	$scope.removeLead = function(lead) {
		offersFactory.removeLead(lead, function(data) {
			if (data.status == 401)
				$scope.logout();
			else if (data.status >= 300)
				console.log("error:", data.data.message)
			else if (data.length > 0) {
				$scope.leads = data;
				$scope.leadView = data[0];
			} else {
				$scope.leads = null;
				$scope.leadView = null;
			}
		});
	};

	$scope.showProposalPage = function(proposal_id){
		routesFactory.setOrigin('/proposals');
		$location.url(`/show-proposal/${proposal_id}`);
	};


	$scope.EGoffer = {
		EGlabors: [],
		EGmaterials: [],
		EGmachines: [],
	};

	function clearEGofferDetails(){
		$scope.EGoffer.EGlabors = [];
		$scope.EGoffer.EGmaterials = [];
		$scope.EGoffer.EGmachines = [];
	}

// NEW CHART CONFIGURATION OPTIONS

	$scope.EGEstimate;

		$scope.options = {
			legend: {
				display: false
			},
			title: {
				display: true,
				position: 'top',
				text: "Comparing Offers By Total Cost in $",
				fontSize: 30
			},
			scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true
                }
            }]
        }
		}

		// $scope.colors = ['#7AC200', '#F6A623'];

		$scope.labels = ['Husky', 'V-Necks', 'Hoverboard', 'Avengers', 'Raiders', 'Madison Ivy', 'Justice League'];
		$scope.series = ['Series A', 'Series B'];

		$scope.data = [
		[65, 65, 65, 65, 65, 65, 65],
		[65, 59, 80, 81, 56, 55, 60]
		];

		$scope.datasetOverride = [
		{
			label: "EG Estimate",
			borderWidth: 1,
			type: 'line',
			pointRadius: 0,
			backgroundColor: 'rgba(122, 194, 0, 0.2)'
		},
		{
			label: "Offer",
			borderWidth: 1,
			type: 'bar',
			backgroundColor: ["#7AC200", "#F6A623"]
		}
		];


		function drawNewChart(data){
			// reset dataset
			$scope.labels = [];
			$scope.data[0] = [];
			$scope.data[1] = [];
			//push first bar as EG estimate
			$scope.labels.push("EG Estimate");
			$scope.data[1].push($scope.EGEstimate)
			$scope.data[0].push($scope.EGEstimate)
			for ( var i = 0; i < data.applications.length; i++ ) {
				$scope.labels.push(data.applications[i].company);
				$scope.data[1].push(data.applications[i].total)
				$scope.data[0].push($scope.EGEstimate)
			}
			// push last empty bar so that green line extends completely
			$scope.labels.push("");
			$scope.data[1].push(0);
			$scope.data[0].push($scope.EGEstimate)
			// reset colors for bars
			$scope.datasetOverride[1].backgroundColor = [];
			for (var i = 0; i <= data.applications.length; i++) {
				if( i == 0){
					$scope.datasetOverride[1].backgroundColor.push("#7AC200")
				} else if( i == $scope.offers.indexOf($scope.offerView) + 1){
					$scope.datasetOverride[1].backgroundColor.push("#F6A623")
				} else{
					$scope.datasetOverride[1].backgroundColor.push("rgba(0, 0, 0, 0.3)")
				}
			}
		}














});
