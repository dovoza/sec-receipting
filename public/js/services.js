
receipt.service('manageData', ['$http', function($http){

	this.insertUser = function(user){
	
		return $http.post('/addNewUser', user);
	};

	this.getUsers = function () {
		return $http.post('/showAllUsers');
	};

}]);