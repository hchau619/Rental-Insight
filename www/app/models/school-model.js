angular.module('rentalinsight.models')

.factory('SchoolModel',['$q','YelpService',function($q, YelpService){
	var localSchools;
	
	// get local schools
	return {
		"getSchools": function(latLng){
			log("getting schools")
			var d = $q.defer();
			var params = {
						term: "school",
						ll: latLng[0]+","+latLng[1]
					};

			YelpService.searchAPI(params).then(function(data){
				localSchools = data.data;
				d.resolve(localSchools);
			}, function(err){
				d.reject(err);
			});

			return d.promise;
		}
	};

}]);