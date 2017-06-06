var app = angular.module("app", ["chart.js", "ngRoute", "ngCookies", "ngSanitize"]);
app.config(function ($routeProvider) {
	$routeProvider
	.when("/", {
		templateUrl: "partials/index.html",
		controller: "indexController"
	})
	.when("/charts", {
		templateUrl: "partials/charts.html",
		controller: "chartsController"
	})
	.when("/register/:type", {
		templateUrl: "partials/register.html",
		controller: "registerController"
	})
	.when("/login", {
		templateUrl: "partials/login.html",
		controller: "indexController"
	})
	.when("/success", {
		templateUrl: "partials/success.html",
		controller: "successController"
	})
	.when("/recover", {
		templateUrl: "partials/recover.html"
	})
	.when("/dashboard", {
		templateUrl: "partials/dashboard.html",
		controller: "dashboardController"
	})
	.when("/proposals", {
		templateUrl: "partials/proposals.html",
		controller: "proposalsController"
	})
	.when("/offers", {
		templateUrl: "partials/offers.html",
		controller: "offersController"
	})
	.when("/tracking", {
		templateUrl: "partials/tracking.html",
		controller: "trackingController"
	})
	.when("/profile", {
		templateUrl: "partials/profile.html",
		controller: "profileController"
	})
	.when("/profile/:id", {
		templateUrl: "partials/profile.html",
		controller: "profileController"
	})
	.when("/messages/:proposal_id?", {
		templateUrl: "partials/messages.html",
		controller: "messagesController"
	})
	.when("/show-proposal/:id", {
		templateUrl: "partials/show-proposal.html",
		controller: "showProposalController"
	})
	.when("/create-proposal", {
		templateUrl: "partials/create-proposal.html",
		controller: "createProposalController"
	})
	.when("/open-proposals/:page?", {
		templateUrl: "partials/open-proposals.html",
		controller: "openProposalsController"
	})
	.when("/create-offer/:id", {
		templateUrl: "partials/create-offer.html",
		controller: "createOfferController"
	})
	.when("/show-offer/:proposal_id/:user_id", {
		templateUrl: "partials/show-offer.html",
		controller: "showOfferController"
	})
	.when("/processes", {
		templateUrl: "partials/processes.html",
		controller: "processesController"
	})
	.when("/error", {
		templateUrl: "partials/error.html"
	})
	.otherwise({
		redirectTo: "/"
	});
});
