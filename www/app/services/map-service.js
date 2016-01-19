
angular.module('rentalinsight.services')

.factory('MapService',['$rootScope','$http', '$window', '$q', '$compile', 
	function($rootScope, $http, $window, $q, $compile){

		var MapService  = {};
		var geocodeBaseUrl = "http://maps.googleapis.com/maps/api/geocode/json?address=";
		var region = "&region=us";
		var DEFAULT_RADIUS = 32.19; //Aprox. 20 miles
		var markers = {};
		var mainMap;
		var groceryMap;
		var schoolMap;
		var heatmap;
		var infoWin;
		var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		var center = { lat: 32.7490166, lng: -117.1194896 };
		var crimeUI;

		// Formats url for geocode lookup
		function urlFormat(str){
			var result = str.split(" ");
			if(result.length === 1){
				return result[0];
			}
			return result.join('+');
		}

		// Converts meter to mile
		MapService.meterToMile = function(meter){
			var mi = meter/1609.344;
			return parseFloat(Math.round(mi * 100) / 100).toFixed(2);
		}

		// Convert mile to km
		function toKm(mile){
			return mile * 1.609344;
		}

		// Create CRIME button on map
		function TopLeftCtrl(controlDiv, map){
			crimeUI = $window.document.createElement('div');
			crimeUI.id = 'crimeUI';
		  crimeUI.title = 'Click to see crime heatmap';
		  crimeUI.className = "botton mapCtrlUI";
		  controlDiv.appendChild(crimeUI);

		  // Set CSS for the control interior
		  var crimeText = $window.document.createElement('div');
		  crimeText.id = 'crimeText';
		  crimeText.innerHTML = 'CRIME';
		  crimeText.className = "mapCtrlText"
		  crimeUI.appendChild(crimeText);

		  crimeUI.addEventListener('click', function() {
		  	$rootScope.$emit('crime:clicked', center);
		  });
		}
	  
	  // Initialize main map
	  MapService.initMap = function() {
	  	if(!mainMap){
	  		log("loading map")
	  		// Create map
		  	mainMap = new google.maps.Map($window.document.getElementById("map"), {
			    center: center,
			    zoom: 11,
			    mapTypeId: google.maps.MapTypeId.ROADMAP,
			    zoomControl: false,
			    streetViewControl: true,
		    	mapTypeControl: false
			  });

		  	// Add custom control
			  var topLeftCtrlDiv = $window.document.createElement('div');
			  var topLeftCtrl = new TopLeftCtrl(topLeftCtrlDiv, mainMap);
			  topLeftCtrl.index = 0;
			  topLeftCtrlDiv.style['padding-top'] = '10px';
			  topLeftCtrlDiv.style['padding-left'] = '10px';
			  mainMap.controls[google.maps.ControlPosition.LEFT_TOP].push(topLeftCtrlDiv);

			  // Initialize heatmap
			  heatmap = new google.maps.visualization.HeatmapLayer({
				  radius: 13,
				  maxIntensity: 10
				});
	  	}
		};

		// Initilize grocery map
		MapService.initGroceryMap = function(latLng, data) {
	  	groceryMap = new google.maps.Map($window.document.getElementById("groceryMap"), {
		    center: {
		    	lat: latLng[0],
		    	lng: latLng[1]
		    },
		    zoom: 14,
		    mapTypeId: google.maps.MapTypeId.ROADMAP,
		    zoomControl: false,
		    streetViewControl: true,
	    	mapTypeControl: false
		  });

		  var stores = data.businesses;
		  var len = stores.length;
		  var labelIndex = 0;
		  // add grocery store markers
	  	for(var i = 0; i < len; i++){
	  		var marker = new google.maps.Marker({
					position: {
						lat: stores[i].location.coordinate.latitude,
						lng: stores[i].location.coordinate.longitude
					},
					animation: google.maps.Animation.DROP,
					label: labels[labelIndex++ % labels.length],
					zIndex: i
				});
				marker.setMap(groceryMap)
				makeInfoWindow(marker, stores[i], groceryMap);
	  	}

	  	// add rental unit marker
	  	var centerMarker = new google.maps.Marker({
				position: {
					lat: latLng[0],
					lng: latLng[1]
				},
				animation: google.maps.Animation.DROP,
				icon: 'img/centerMarker.png',
				zIndex: len
			});
			centerMarker.setMap(groceryMap)

		};

		// Initialize school map
		MapService.initSchoolMap = function(latLng, data) {
	  	schoolMap = new google.maps.Map($window.document.getElementById("schoolMap"), {
		    center: {
		    	lat: latLng[0],
		    	lng: latLng[1]
		    },
		    zoom: 14,
		    mapTypeId: google.maps.MapTypeId.ROADMAP,
		    zoomControl: false,
		    streetViewControl: true,
	    	mapTypeControl: false
		  });

		  var schools = data.businesses;
		  var len = schools.length;
		  var labelIndex = 0;
		  // Make school markers
	  	for(var i = 0; i < len; i++){
	  		var marker = new google.maps.Marker({
					position: {
						lat: schools[i].location.coordinate.latitude,
						lng: schools[i].location.coordinate.longitude
					},
					animation: google.maps.Animation.DROP,
					label: labels[labelIndex++ % labels.length],
					zIndex: i
				});
				marker.setMap(schoolMap)

				makeInfoWindow(marker, schools[i], schoolMap);
		
	  	}

	  	// make rental unit marker
	  	var centerMarker = new google.maps.Marker({
				position: {
					lat: latLng[0],
					lng: latLng[1]
				},
				animation: google.maps.Animation.DROP,
				icon: 'img/centerMarker.png',
				zIndex: len
			});
			centerMarker.setMap(schoolMap)

		};

		// Initialize Street view
		MapService.initStreetView = function(latLng){
			var panorama = new google.maps.StreetViewPanorama(
      $window.document.getElementById('streetView'), {
        position:{
        	lat: latLng[0],
        	lng: latLng[1]
        },
        pov:{
          heading: 0,
          pitch: 10
        }
      });
		};

		// Make an infowindow in map
		function makeInfoWindow(marker, data, map){
			var content = "<div class='infoWindow'>"+
											"<div class='col col-70'>" +   
												"<a >"+ data.name + "</a>" +
												"<img src="+data.rating_img_url+">"+
												"<p>" + data.review_count +" reviews </p>" + 
												"<p>" + MapService.meterToMile(data.distance) + " miles</p>"+
											"</div>" +
											"<div class='col col-30'>"+
												"<img src="+data.image_url+" style='width:100%'>"+
											"</div>"+
										"<div>";

		  marker.addListener('click', function() {
		  	if(infoWin)
		  		infoWin.close();

		  	infoWin = new google.maps.InfoWindow({
			    content: content,
			    maxWidth: 250
			  });
		  	
		    infoWin.open(map, marker);
		  });
		}

		// Switch CRIME button on and off
		MapService.toggleCrimeButton = function(){
			if(heatmap.getMap() == null){
				crimeUI.className = "mapCtrlUI button-dark-green";
			}else{
				crimeUI.className = "mapCtrlUI";
			}
		};

		// Toggles heatmap
		$rootScope.$on("crimes:ready", function(ev, crimes){
			if(heatmap.getMap() == null){
				var heatpoints = [];
				for (var key in crimes){
					var lat = crimes[key].location[0];
					var lng = crimes[key].location[1];
					heatpoints.push(new google.maps.LatLng(lat, lng));
				}
				heatmap.setData(heatpoints);
		  	heatmap.setMap(mainMap);
			}
			else{
				heatmap.setMap(null);
			}
		});

		// Get a marker
		MapService.getMarker = function(key){
			return markers[key];
		};

		// Make a marker
		MapService.createMarker = function(key, coord){
			var marker = new google.maps.Marker({
				position: {
					lat: coord[0],
					lng: coord[1],
				},
				animation: google.maps.Animation.DROP
			});
			marker.setMap(mainMap)
		  markers[key] = marker;

		  return markers[key];
	  };

	  // Add event listener to post marker
	  MapService.attachMarkerInfoModal = function(marker, post){
			marker.addListener('click', function() {
				$rootScope.$emit('marker:clicked', post);
		  });
	  };

	  // Delete a marker
	  MapService.deleteMarker = function(key){
	  	if(markers[key]){
	  		markers[key].setMap(null);
	  		delete markers[key];
	  	}
	  };

	  // Set map center
		MapService.setCenter = function(latLng){
			center = latLng;
			if(mainMap){
				mainMap.setCenter(latLng);
			}
		};

		// Get map center
		MapService.getCenter = function(){
			log("get center")
			log(center);
			return center;
		};

		// Get Lat and Lng base on address
		MapService.getLatLng = function(addr){
			var deferred = $q.defer();
			var address = '';

			if(addr == null || addr == ""){
				deferred.reject({error: "EMPTY_ADDRESS"});
			}
			
			if(typeof addr === "object"){
				for (var key in addr){
					if(addr.hasOwnProperty(key) && addr[key] != null){
						address += urlFormat(addr[key]);
					}
				}
			}
			else{ //address is string
				address = urlFormat(addr);
			}

			var options = {
				method: 'GET',
				url: geocodeBaseUrl+address+region,
			};

			$http(options).then(function(res){
				deferred.resolve(res);
			},function(err){
				deferred.reject(err);
			});

			return deferred.promise;
		};

		return MapService;
	}]);