app.controller('messagesController', function ($scope, $rootScope, $location, $timeout, $routeParams,
offersFactory, messagesFactory, socketsFactory, usersFactory) {
	if ($scope.id) {
		$scope.tab = "messages";
		$scope.status = 0;

		if ($scope.hasNewMessage) {
			usersFactory.setHasNewMessage({hasNewMessage: 0}, function(data) {
				if (data.status == 401)
					$scope.logout();
				else if (data.status >= 300)
					console.log("error:", data.data.message)
				else
					$rootScope.hasNewMessage = false;
			});
		}

		if ($scope.hasBeenAccepted) {
			usersFactory.setHasBeenAccepted({hasBeenAccepted: 0}, function(data) {
				if (data.status == 401)
					$scope.logout();
				else if (data.status >= 300)
					console.log("error:", data.data.message)
				else
					$rootScope.hasBeenAccepted = false;
			});
		}

		offersFactory.getAcceptedOffers(function(data) {
			if (data.status == 401)
				$scope.logout();
			else if (data.status >= 300)
				console.log("error:", data.data.message)
			else {
				$scope.offers = data;

				// Check if certain conversation requested in URL:
				if ($routeParams.proposal_id) {
					for (var i = 0; i < data.length; i++) {
						if ($routeParams.proposal_id == data[i].proposal_id) {
							$scope.showMessages(data[i]);
							break;
						}
					}
				}
			}
		});
	}
	else
		$location.url('/');

	//////////////////////////////////////////////////////
	//										HELPER FUNCTIONS
	//////////////////////////////////////////////////////

	//////////////////////////////////////////////////////
	//										MESSAGE
	//////////////////////////////////////////////////////
	$scope.showMessages = function(offer) {
		$rootScope.messages = [];
		$rootScope.cur_offer = offer;
		messagesFactory.show(offer.proposal_id, function(data) {
			if (data.status == 401)
				$scope.logout();
			else if (data.status >= 300)
				console.log("error:", data.data.message)
			else {
				$rootScope.messages = data;
				$timeout(function() {
					var _ = document.getElementById("chat");
					_.scrollTop = _.scrollHeight;
				}, 0, false);
			}
		});
	}

	$scope.createMessage = function() {
		if ($scope.new_message) {
			var data = {
				message: $scope.new_message,
				company: $rootScope.company,
				contact: $rootScope.contact,
				picture: $rootScope.picture,
				proposal_id: $scope.cur_offer.proposal_id,
				user_id: $rootScope.id,
				type: $rootScope.type,
				created_at: new Date()
			}
			socketsFactory.emit('send', data);

			messagesFactory.create(data, function(data) {
				if (data.status == 401)
					$scope.logout();
				else if (data.status >= 300)
					console.log("error:", data.data.message)
				else
					$scope.new_message = "";
			});
		}
	}

	$scope.contactAdmin = function(){
		messagesFactory.contactAdmin({'text':$scope.ticket_body}, function(data){
			if (data.status == 401)
				$scope.logout();
			else {
				$('.ui.modal').modal('hide');
				$scope.ticket_status = 'Your ticket has been sent';
			}
		});
	}

	$scope.ticketCheck = function(){
		if ($scope.ticket_status){
			$scope.ticket_status = "Your ticket is already being processed";
			setTimeout(function(){
				$('.ui.modal').modal('hide');
			},500);
		}
	}
});
