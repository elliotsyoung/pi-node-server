app.factory('routesFactory',function($location){
  var origin = '/';

  return {
    setOrigin: function(route){
      origin = route;
    },
    goBack: function(){
      $location.url(origin)
    }
  }
});
