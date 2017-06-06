app.controller('chartsController', function ($rootScope, $scope, $location, $routeParams,
	proposalsFactory, offersFactory) {

	$scope.options = {
		legend: {
			display: true
		},
		title: {
			display: true,
			position: 'bottom',
			text: "Total Cost",
			fontSize: 16
		}
	}

	$scope.colors = ['#7AC200', '#F6A623'];

	$scope.labels = ['Husky', 'V-Necks', 'Hoverboard', 'Avengers', 'Raiders', 'Madison Ivy', 'Justice League'];
	$scope.series = ['Series A', 'Series B'];

	$scope.data = [
	[65, 65, 65, 65, 65, 65, 65],
	[65, 59, 80, 81, 56, 55, 60]
	];

	setTimeout( () => {
		$scope.data = [
			[65, 65, 65, 65, 65, 65, 65],
			[65, 99, 10, 81, 56, 55, 20]
		];
		console.log('success');
		$scope.$apply();
	}, 2000
);


		$scope.datasetOverride = [
	{
		label: "EG Cost",
		borderWidth: 1,
		type: 'line',
		pointRadius: 0,
		backgroundColor: 'rgba(122, 194, 0, 0.2)'
	},
	{
		label: "Offer",
		borderWidth: 1,
		type: 'bar',
		backgroundColor: ["rgba(122, 194, 0, 1)", "rgba(246,166,35,1)"]
	}
	];

});
