
$('#LinkedInLogin').click(function(){
  if (IN.User.isAuthorized()) {
    IN.API.Raw('/people/~:(id,first-name,last-name,email-address)?format=json').result(function(data){
      console.log(data);
    });
  } else {
    IN.User.authorize(function(){
      console.log(IN.User.getMemberId());
    });
  }
});
