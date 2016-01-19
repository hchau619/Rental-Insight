angular.module('rentalinsight.models')

.factory('GroceryModel',['$q','YelpService',function($q, YelpService){
	var localGroceries;

	// Get local grocery stores
	return {
		"getGroceries": function(latLng){
			log("getting groceries")
			var d = $q.defer();
			var params = {
						term: "grocery",
						ll: latLng[0]+","+latLng[1]
					};

			YelpService.searchAPI(params).then(function(data){
				localGroceries = data.data;
				d.resolve(localGroceries);
			}, function(err){
				d.reject(err);
			});

			return d.promise;
		}
	};
}]);