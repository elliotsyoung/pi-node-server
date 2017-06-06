app.factory('chartsFactory', function($q) {
	var chart;

	// ChartGenerator class definition:
	function ChartGenerator() {
		var self = this;
		var defaultChartWidth = 1000
		var defaultChartHeight = 400

		this.template = {};
		this.template.bartitle = 'company';
		this.template.metric = 'total';
		this.template.charttitle = "";
		this.template.width = defaultChartWidth;
		this.template.height = defaultChartHeight;

		this.defaultColor = 'gray';
		this.customColorsForFirstNBars = [];
		this.firstNBars = [];
		this.dataset = [{company:"blanderschmidt", total:50}, {company:"goopenheimer", total:20}];

		this.clearChartData = function() {
			this.customColorsForFirstNBars = [];
			this.firstNBars = [];
			this.template.charttitle = "";
		};

		this.drawChart = function() {
			try {
				var data = [[self.template.bartitle, self.template.metric, { role: 'style' }]];
				data = pushDataSet(data);
				data = google.visualization.arrayToDataTable(data);

				// Set chart options:
				var options = {
					'title': self.template.charttitle,
					'chartArea': {'width': '80%', 'height': '80%'},
					'legend': {position:'none'},
					'width': self.template.width,
					'height': self.template.height
				};

				// Instantiate and draw our chart, passing in some options:
				var chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));
				chart.draw(data, options);
			}
			catch(err) {
				console.log(err);
			}
		};

		function pushDataSet(arr) {
			var customColorIndex = 0
			for (var i = 0; i < self.firstNBars.length; i++) {
				var customColor = self.defaultColor;
				if (self.firstNBars[i]) {
					if (self.customColorsForFirstNBars[customColorIndex]) {
						customColor = self.customColorsForFirstNBars[customColorIndex];
						customColorIndex++;
					}
					arr.push([self.firstNBars[i][self.template.bartitle], parseInt(self.firstNBars[i][self.template.metric]), "color: "+customColor]);
				}
			}

			for (var i = 0; i < self.dataset.length; i++) {
				var customColor= self.defaultColor;
				var alreadyInArray = false;
				for (var j = 0; j < self.firstNBars.length; j++) {
					if (self.dataset[i] == self.firstNBars[j]) {
						alreadyInArray = true;
					}
				}

				if (!alreadyInArray) {
					if (self.customColorsForFirstNBars[customColorIndex]) {
						customColor = self.customColorsForFirstNBars[customColorIndex]
						customColorIndex++;
					}
					arr.push([self.dataset[i][self.template.bartitle], parseInt(self.dataset[i][self.template.metric]), "color: "+customColor]);
				}
			}

			return arr;
		};
	}

	return {
		getChart: function() {
			return chart;
		},
		load: function() {
			google.charts.load('current', {'packages':['corechart']});
			google.charts.setOnLoadCallback(function() {
				chart = new ChartGenerator();
			});
		},
	}
});
