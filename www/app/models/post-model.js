"use strict";
angular.module('rentalinsight.models')

.factory('PostModel',['$q', '$timeout', '$rootScope', 'MapService', function($q, $timeout, $rootScope, MapService){
	var baseURL = "https://rentalinsight.firebaseio.com/";
	var PostModel  = {};
	var fbRef = new Firebase(baseURL);
	var postRef = fbRef.child('posts');
	var imgRef = fbRef.child('post_images');
	var accRef = fbRef.child('accounts');
	var postLocRef = fbRef.child('post_locations');
	var geoFire = new GeoFire(postLocRef);
	var queryResults = {}; 
	var geoQuery;
	var onKeyEnteredRegistration;
	var onKeyExitedRegistration;
	var onKeyReadyRegistration;
	var searchFilter;

	// Start geofencing
	function initQuery(center,radius){
		geoQuery = geoFire.query({
	  	center: center,
	  	radius: radius 
	  });

	  onKeyEnteredRegistration = geoQuery.on("key_entered", function(key, loc, dis) {
			PostModel.getPost(key).then(function(post){
				if(matchedFilterCriteria(post)){
					queryResults[key] = {"location": loc};
					post.key = key;
					queryResults[key].post = post;
					// Make markers on main map
					var marker = MapService.createMarker(key,queryResults[key].location);
					MapService.attachMarkerInfoModal(marker,post);
				}
			}, function(err){
				log(err);
			});
		});

		onKeyExitedRegistration = geoQuery.on("key_exited", function(key, loc) {
			// Clen up markers
			delete queryResults[key];
			if(MapService.getMarker(key)){
				MapService.deleteMarker(key);
			}
		});

		// Notify handler that no results are found
		onKeyReadyRegistration = geoQuery.on("ready",function(){
			$timeout(function(){
				if(Object.keys(queryResults).length == 0){
					$rootScope.$emit("no_results");
				}
			},1000);
		})
	}
	
	// Filter posts by filter criteria
	function matchedFilterCriteria(post){
		if(searchFilter == null){
			return true;
		}

		// Check price range
		if(searchFilter.rent){
			if(searchFilter.rent.min){
				if(post.rent < searchFilter.rent.min ) return false;
			}
			if(searchFilter.rent.max){
				if(post.rent > searchFilter.rent.max ) return false;
			}
		}
		// Check type
		if(searchFilter.type){
			if((post.type).toLowerCase() != (searchFilter.type).toLowerCase()){
				return false;
			}
		}
		// Check bedrooms
		if(searchFilter.bedrooms){
			if(post.bedrooms[0] < searchFilter.bedrooms[0]){
				return false;
			}
		}
		// Check bathrooms
		if(searchFilter.bathrooms){
			if(post.bathrooms[0] < searchFilter.bathrooms[0]){
				return false;
			}
		}

		return true;
	}

	// Index rental unit location
	function setPostLocation(key,coord){
		geoFire.set(key,coord).then(function() {
		  log("Provided key has been added to GeoFire");
		}, function(error) {
		  log("Error: " + error);
		});
	};

	// Stop geofencing
	function cancelGeoQuery(){
		for(var key in queryResults){
			MapService.deleteMarker(key);
		}
		queryResults = {};
		geoQuery.cancel();
	}

	// Search for posts
	PostModel.search = function(query, params){
		searchFilter = params ? params : null; 
		var coord = {};
		var deferred = $q.defer();
 		var radius = (params && params.radius) ? (params.radius * 1.609344) : 32.19;
 		query = query.trim();

    MapService.getLatLng(query).then(successCallback,errorCallback);
    
    function successCallback(res){
    	var status = res.data.status;
			if(status === "OK"){
  			coord = res.data.results[0].geometry.location;
  			
  			if(geoQuery){
  				cancelGeoQuery();
  			}

				initQuery([coord.lat, coord.lng], radius);
				MapService.setCenter({lat: coord.lat, lng: coord.lng});
				deferred.resolve({status: "OK"});
  		}
			else if(status === "ZERO_RESULTS") {
				deferred.resolve({status: "ZERO_RESULTS"});
			}
			else{
				deferred.reject({status: "SOMTHING_WRONG"});
			}
		}

		function errorCallback(err){
			deferred.reject(err);
		}

		return deferred.promise;
	};

	// Add a post
	PostModel.addPost = function(postData){
		var coord = [];
		var deferred = $q.defer();
		var error = false;
		
		// Add Timestamp
		var now = new Date();
		postData.timestamp = now.getTime();
		var offset = now.getTimezoneOffset();
		var localTime = now.getTime() - (offset * 60000);
		postData.timestampString = (new Date(localTime)).toDateString();
		
		// Format Available Date
		var regex = /\d\d\d\d-\d\d-\d\d/;
		postData.availableDate = JSON.stringify(postData.availableDate).match(regex)[0]; 
		
		// Seperate image for seperate upload
		var images = postData.images;
		delete postData.images;

  	MapService.getLatLng(postData.address).then(function(res){
			coord[0] = res.data.results[0].geometry.location.lat;
			coord[1] = res.data.results[0].geometry.location.lng;
			postData.location = coord;
			processAdd();
		}, function(err){
			deferred.reject(err);
		});

  	function processAdd(){
  		var ref = postRef.push(postData,errorCallback);
  		if(!error)
  			imgRef.child(ref.key()).set(images, errorCallback);
			
			if(!error)
				postRef.child(ref.key()).child('key').set(ref.key(), errorCallback);
			
			if(!error)
				setPostLocation(ref.key(),coord);
			
			if(!error)
				deferred.resolve({status: "SUCCESS", postKey: ref.key()});
			else
				deferred.reject(error);
  	}

  	function errorCallback(e){
  		if(e) error = e;
  	}

  	return deferred.promise;
	};

	// Get a post by key
	PostModel.getPost = function(key){
		var deferred = $q.defer();
		postRef.child(key).once('value', function(dataSnap){
			deferred.resolve(dataSnap.val());
		},function(err){
			deferred.reject(err);
		});
		return deferred.promise;
	};

	// Get all posts by current user
	PostModel.getPosts = function(uid){
		var q = $q.defer();
		
		// Get keys of posts posted by user
		fbRef.child('accounts').child(uid).child('posts').once('value', function(dataSnap){
			var keysArray = [];
			for(var key in dataSnap.val()){
				keysArray.push(key);
			}
			collectPosts(keysArray);
		},function(err){
			q.reject(err);
		});

		// Get posts
		function collectPosts(keys){
			var len = keys.length;
			var promises = [];
			for(var i = 0; i < len; i++){
				promises.push(PostModel.getPost(keys[i]));
			}
			$q.all(promises).then(function(posts){
				q.resolve(posts);
			});
		}

		return q.promise;
	};

	// Delete a post
	PostModel.deletePost = function(uid, key){
		accRef.child(uid).child('posts').child(key).set(null);
		postLocRef.child(key).set(null);
		postRef.child(key).set(null);
		imgRef.child(key).set(null);
	};

	// Get images connected to a post
	PostModel.getPostImages = function(key){
		var deferred = $q.defer();
		imgRef.child(key).once('value', function(dataSnap){
			deferred.resolve(dataSnap.val());
		},function(err){
			deferred.reject(err);
		});
		return deferred.promise;
	};

	
	PostModel.geoQueryCancel = function(){
  	geoQuery.cancel();
  };

	return PostModel;
}]);