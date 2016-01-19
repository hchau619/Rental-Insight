"use strict";
angular.module('rentalinsight.controllers')

.controller("DetailsCtrl", ['$ionicModal', '$cordovaInAppBrowser','$rootScope','$scope', '$timeout', '$window', 'PostModel','CrimeModel', 'GroceryModel', 'SchoolModel', 'MapService',
	function($ionicModal, $cordovaInAppBrowser, $rootScope, $scope, $timeout, $window, PostModel, CrimeModel, GroceryModel, SchoolModel, MapService){
		var scope = this;

  	$scope.groceryStores;
  	$scope.schools;
  	$scope.labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  	$scope.localCrimes;
		$scope.pieLabels = [];
  	$scope.pieData = [];
  	$scope.pieOptions = {
  		segmentShowStroke : false,
  		legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\">"+
  										 	"<% for (var i=0; i<segments.length; i++){%>"+
  										 	"<li>"+
  										 		"<span style=\"background-color:<%=segments[i].fillColor%>\">"+
  										 		"</span><%if(segments[i].label){%><%=segments[i].label+': '+segments[i].value%><%}%>"+
  										 	"</li><%}%>"+
  										 	"</ul>"
  	};
  	var browserOptions = {
	    location: 'yes',
	    clearcache: 'yes'
	  };

	  // Get local crimes
  	CrimeModel.getLocalCrimes($scope.selectedPost.location).then(function(data){
      $scope.localCrimes = data;
      initPieChart();
    }, function(err){
      log(err);
    });

  	// Get local grocery stores
		GroceryModel.getGroceries($scope.selectedPost.location).then(function(data){
			getSchools();
			MapService.initGroceryMap($scope.selectedPost.location, data);
			$scope.groceryStores = data.businesses;
		},function(err){
			log(err);
		});

		// Get local schools
		function getSchools(){
			SchoolModel.getSchools($scope.selectedPost.location).then(function(data){
				MapService.initSchoolMap($scope.selectedPost.location, data);
				$scope.schools = data.businesses;
			},function(err){
				log(err);
			});
		}
	
		// Initialize street view
		MapService.initStreetView($scope.selectedPost.location);

		// Initialize crim pie chart
		function initPieChart(){
			var typeDist = CrimeModel.getTypeDistribution($scope.localCrimes);
			for(var type in typeDist){
				$scope.pieLabels.push(type);
				$scope.pieData.push(typeDist[type]);
			}		
		}

		// Show image slides
	  scope.showSlideBox = function(){
	  	$ionicModal.fromTemplateUrl('app/templates/slide-box.html', {
		    scope: $scope,
		    hardwareBackButtonClose: false
		  }).then(function(modal) {
		    $scope.slideBoxModal = modal;
		    $scope.slideBoxModal.show();
		  });
	  };

	  // Close image slide modal
	  scope.closeSlideBox = function(){
	    $scope.slideBoxModal.hide();
	    $scope.slideBoxModal.remove();
	  };

	  // Converts meter to mile
	  scope.meterToMile = function(meter){
	  	return MapService.meterToMile(meter);
	  }
	   
	  // Opens an in-app browser
	  scope.openInAppBrowser = function(url){
	  	$cordovaInAppBrowser.open(url, '_blank',browserOptions);
	  };

}]);