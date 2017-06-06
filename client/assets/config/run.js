app.run(function($rootScope, sessionFactory) {
	sessionFactory.setUser();
	$rootScope.logout = sessionFactory.logout;
});