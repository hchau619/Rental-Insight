angular.module('rentalinsight.models')

.factory('CrimeModel',['$rootScope', '$q', 'MapService', 
	function($rootScope, $q, MapService){
		var baseURL = "https://rentalinsight.firebaseio.com/";
		var CrimeModel  = {};
		var fbRef = new Firebase(baseURL);
		var crimeRef = fbRef.child('crimes');
		var geoFire = new GeoFire(fbRef.child('crime_locations'));
		var crimes;
		var localCrimes; 
		var currentCenter = [0,0];
		var MILLISECS_PER_WEEK = 604800000;

		// Collect crimes for heatmap
		CrimeModel.broadQuery = function(center){
			if(center.toString() == currentCenter.toString()){
				$rootScope.$emit("crimes:ready",crimes);
			}
			else{
				log("getting crimes")
				currentCenter = center;
				crimes = {};
				var i=1;

				var geoQuery = geoFire.query({
			  	center: center,
			  	radius: 32 //Approx. 10 miles
			  });

			  var onKeyEnteredRegistration = geoQuery.on("key_entered", function(key, loc, dis) {	
					crimes[key] = {"location": loc};
					i++;
				});

				var onKeyReadyRegistration = geoQuery.on("ready", function(key, loc) {
					$rootScope.$broadcast("crimes:ready",crimes);
					geoQuery.cancel();
					i=1;
				});
			}
		};

		// Collect local crimes
		CrimeModel.getLocalCrimes = function(center){
			localCrimes = {};
			var getReqDone = 0;
			var i=0;
			var promises = [];
			var q = $q.defer();

			var localQuery = geoFire.query({
		  	center: center,
		  	radius: 1.6 
		  });

		  var onKeyEnteredRegistration = localQuery.on("key_entered", function(key, loc, dis) {
				localCrimes[key] = {"location": loc};
				i++;
				var gotCrime = CrimeModel.getCrime(key);
				promises.push(gotCrime);
				gotCrime.then(function(crime){
					localCrimes[key].crime = crime;
					getReqDone++;
				}, function(err){
					log(err);
				});

			});

			var onKeyReadyRegistration = localQuery.on("ready", function(key, loc) {
				$q.all(promises).then(function(res){
					q.resolve(localCrimes);
				});
			});

			return q.promise;
		};

		// Get data for crime by key
		CrimeModel.getCrime = function(key){
			var q = $q.defer();
			crimeRef.child(key).once('value', function(dataSnap){
				q.resolve(dataSnap.val());
			},function(err){
				q.reject(err);
			});
			return q.promise;
		};

		// Calculate distribution of crimes
		CrimeModel.getTypeDistribution = function(crimeData){
			var types = {};
			var type;

			for(var key in crimeData){
				type = crimeData[key].crime.Charge_Description_Orig;
		
				if(types[type]){
					types[type]++;
				}
				else{
					types[type] = 1;
				}
			}	

			return types;
		};

		return CrimeModel;
}]);