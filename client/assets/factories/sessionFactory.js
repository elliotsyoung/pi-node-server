app.factory('sessionFactory', function($http, $cookies, $rootScope, $window, $location, socketsFactory, chartsFactory) {
	return {
		setUser: function(is_new_user) {
			if ($cookies.get("evergreen_token")) {
				var payload;

				// Try parsing token:
				try {
					payload = JSON.parse($window.atob($cookies.get("evergreen_token").split('.')[1]
					.replace('-', '+').replace('_', '/')));

					// Set user information:
					$rootScope.id = payload.id;
					$rootScope.type = payload.type;
					$rootScope.company = payload.company;
					$rootScope.contact = payload.contact;
					$rootScope.picture = payload.picture;
					$rootScope.created_at = payload.created_at;
					$rootScope.color = $rootScope.type == 0 ? "orange" : "green";
					$rootScope.user = $rootScope.type == 0 ? "maker" : "supplier";
					$rootScope.menu = false;

					// Set notifications:
					$http.get(`/api/users/notifications/${payload.id}`, {
						headers: {'Authorization': `Bearer ${$cookies.get('evergreen_token')}`}
					})
					.then(function(res) {
						$rootScope.myProposals = res.data.proposals;
						$rootScope.myMessages = res.data.messages;
						$rootScope.myJobs = res.data.jobs;
						$rootScope.hasNewOffer = res.data.hasNewOffer;
						$rootScope.hasNewMessage = res.data.hasNewMessage;
						$rootScope.hasBeenAccepted = res.data.hasBeenAccepted;
					}, function(res) {
						if (res.status == 401) {
							this.logout();
						}
						else if (res.status >= 300)
							console.log("error:", res.data.message);
					});

					// Set sockets:
					socketsFactory.connect();
					// If not new user, look for conversations to connect to:
					if (!is_new_user)
						socketsFactory.subscribeToOffers();

					// Load google charts:
					chartsFactory.load();

				} catch (err) {
					console.log(`Error: ${err}. Your session is now ending.`);
					return this.logout();
				}
			}
		},
		logout: function() {
			// Disconnect from sockets:
			socketsFactory.logout();

			// Clear user information:
			$rootScope.id = undefined;
			$rootScope.type = undefined;
			$rootScope.company = undefined;
			$rootScope.contact = undefined;
			$rootScope.picture = undefined;
			$rootScope.created_at = undefined;
			$rootScope.color = undefined;
			$rootScope.user = undefined;
			$rootScope.menu = undefined;
			$rootScope.myProposals = undefined;
			$rootScope.myMessages = undefined;
			$rootScope.myJobs = undefined;
			$rootScope.hasNewOffer = undefined;
			$rootScope.hasNewMessage = undefined;
			$rootScope.hasBeenAccepted = undefined;

			// Logout from linkedin:
			if (IN.User && IN.User.isAuthorized())
				IN.User.logout(function(){
					$cookies.remove("evergreen_token");
					$location.url("/");
				});

			// Clear cookie:
			$cookies.remove("evergreen_token");

			// Relocate:
			$location.url("/");
		}
	}
});
