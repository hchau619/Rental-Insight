"use strict";
angular.module('rentalinsight.controllers')

.controller('AppCtrl',
 ['$rootScope','$scope', '$timeout', '$ionicHistory','$ionicViewSwitcher','$ionicModal', '$ionicPopup', '$location', '$window', '$ionicScrollDelegate','AccountModel', 'PostModel', 'MapService', 'CrimeModel', 'currentAuth',
 function($rootScope, $scope,$timeout, $ionicHistory, $ionicViewSwitcher, $ionicModal, $ionicPopup, $location, $window, $ionicScrollDelegate, AccountModel, PostModel, MapService, CrimeModel, currentAuth ) {
  
  var localScope = this; 

  localScope.appTitle = "RENTAL INSIGHT";
  localScope.query = "";
  localScope.credentials = { email: null, password: null};
  localScope.auth = false;
  localScope.filterParams = {};
  localScope.hasImg = {text: "Has Image", checked: false };
  localScope.radius = [5,10,15,20,25];
  localScope.typeList = ["STUDIO","APARTMENT", "CONDO", "HOUSE", "OTHER"];
  localScope.bedBathRange = ['1+', '2+', '3+', '4+', '5+'];
  localScope.isHome = true;
  
  $scope.selectedPost;
  localScope.user;
  $scope.myPosts;

  //Loads main map on document ready
  angular.element($window.document).ready(function () {
    localScope.initMainMap()
  });

  // Initialize main map
  localScope.initMainMap = function(){
    log("initmap")
    MapService.initMap();
  };

  // Set $scope.selectedPost and show peek modal
  $rootScope.$on('marker:clicked',function(event,post){
    log("marker clicked")
    event.stopPropagation();
    $scope.selectedPost = post;
    $scope.selectedPost.images = [];
    localScope.showPeek();
  });

  // Handles heatmap toggling. Trigger crime collection.
  $rootScope.$on('crime:clicked',function(event,center){
    log('crime:clicked');
    event.stopPropagation();
    $scope.blur();
    MapService.toggleCrimeButton();
    CrimeModel.broadQuery([center.lat, center.lng]);
  });

  // Listens for change in authentication status
  $rootScope.$on('unauthenticated', function(event){
    localScope.auth = false;
  });

  // Display alert when search yeild no result
  $rootScope.$on('no_results', function(event){
    $scope.showErrorAlert("No results found.")
  })

  // Show search bar if on homepage, else show app title.
  $rootScope.$on('$stateChangeSuccess', 
    function(event, toState, toParams, fromState, fromParams){
      log("state changed")
      if(toState.url == "/home"){
        localScope.isHome = true;
        // Fix grey map issue
        localScope.showWait();
      }else{
        localScope.isHome = false; 
      }
     
  });

/**** Modal controls ****/
  localScope.showWait = function() {
    $ionicModal.fromTemplateUrl('app/templates/wait.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.waitModal = modal;
      $scope.waitModal.show();
      $timeout(function(){
        $scope.waitModal.hide();
        $scope.waitModal.remove();
      },100);
      
    });
  };

  localScope.showLogin = function() {
    $ionicModal.fromTemplateUrl('app/templates/login.html', {
      scope: $scope,
      hardwareBackButtonClose: false
    }).then(function(modal) {
      $scope.loginModal = modal;
      $scope.loginModal.show();
    });
  };

  localScope.closeLogin = function() {
    $scope.loginModal.hide();
    $scope.loginModal.remove();
  };

  localScope.showRegistration = function(){
    $ionicModal.fromTemplateUrl('app/templates/registration.html', {
      scope: $scope,
      hardwareBackButtonClose: false
    }).then(function(modal) {
      $scope.registrationModal = modal;
      localScope.credentials = {};
      $scope.registrationModal.show();
    });  
  };

  localScope.closeRegistration = function(){
    $scope.registrationModal.hide();
    $scope.registrationModal.remove();
  };

  localScope.showSearchFilter = function(){
    $ionicModal.fromTemplateUrl('app/templates/search-filter.html', {
      scope: $scope,
      hardwareBackButtonClose: false
    }).then(function(modal) {
      $scope.searchFilterModal = modal;
      $scope.searchFilterModal.show();
    });
  }

  localScope.closeSearchFilter = function(){
    $scope.searchFilterModal.hide();
    $scope.searchFilterModal.remove();
  }

  localScope.showPeek = function(){
    $ionicModal.fromTemplateUrl('app/templates/details-peek.html', {
      scope: $scope,
      hardwareBackButtonClose: false
    }).then(function(modal) {
      $scope.postDetailsPeekModal = modal;
      $scope.postDetailsPeekModal.show();
    });
  };

  localScope.closePeek = function(){
    $scope.postDetailsPeekModal.hide();
    $scope.postDetailsPeekModal.remove();
  };

/**** Alerts ****/

  $scope.showErrorAlert = function(err) {
    var alertPopup = $ionicPopup.alert({
      title: err,
      cssClass: "text-center",
      buttons: [{
        text: 'OK',
        type: 'button button-assertive',
        onTap: function(e) {
          e.preventDefault();
          alertPopup.close();
        }
      }]
    });
  };

  $scope.generalErrorAlert = function(){
    $scope.showErrorAlert("Something went wrong. Please try again later.");
  }

  $scope.showSuccessAlert = function(msg) {
   var alertPopup = $ionicPopup.alert({
    title: msg,
    cssClass: "text-center",
      buttons: [{
        text: 'OK',
        type: 'button button-balanced',
        onTap: function(e) {
          e.preventDefault();
          alertPopup.close();
        }
      }]
   });
  };

  // A confirm dialog
  $scope.showConfirm = function(confirm) {
   var confirmPopup = $ionicPopup.confirm({
     title: confirm
   });
   return confirmPopup;
  };

  // Jump scroll
  $scope.scrollTo = function(id) {
    $location.hash(id);
    $ionicScrollDelegate.anchorScroll(true);
    $ionicScrollDelegate.scrollBy(0, -44, true);
  };

  $scope.blur = function(){
    $window.document.activeElement.blur();
  };


/**** General  ****/
  localScope.createAccount = function(){
    if(localScope.registrationForm.$invalid){
      $scope.showErrorAlert("One or more field is invalid or missing.");
      return;
    }

    AccountModel.createAccount(localScope.credentials)
    .then(function(userData) {
      localScope.credentials = {};
      $scope.showSuccessAlert("Account created successfully! Go back and login.");
    }, function(err){
      $scope.showErrorAlert(err)
    });
    localScope.registrationForm.$setPristine();
    localScope.registrationForm.$setUntouched();
  };

  localScope.doLogin = function() {
    if(localScope.loginForm.$invalid){
      $scope.showErrorAlert("One or more field is invalid or missing.");
      return;
    }

    AccountModel.login(localScope.credentials)
    .then(function(userData) {
      $scope.showSuccessAlert("Success!! You are now logged in.");
      localScope.user = userData;
      log(userData)
      localScope.credentials = {};
      localScope.closeLogin();
      localScope.auth = true;
    }, function(err){
      localScope.credentials = {};
      $scope.showErrorAlert(err)
    });
    localScope.loginForm.$setPristine();
    localScope.loginForm.$setUntouched();

  };

  localScope.doLogout = function() {
    log("loggin out")
    $scope.myPosts = {};
    localScope.user = {};
    AccountModel.logout();
    $ionicHistory.clearHistory();
    $location.path("/home");

  };  

  // Handles normal search
  localScope.search = function(){
    $window.document.activeElement.blur();
    if(localScope.searchForm.$invalid){
      $scope.showErrorAlert("Query can not be empty.");
      return;
    }
   

    PostModel.search(localScope.query).then(function(res){
      if(res.status === "OK"){
        //log("Status: " + res.status);
        localScope.searchForm.$setPristine();
        localScope.searchForm.$setUntouched();
      }
      else{
        if(res.status == "ZERO_RESULTS"){
          $scope.showErrorAlert("No results found.");
        }else{
          $scope.generalErrorAlert();
        }
      }
    }, $scope.generalErrorAlert);
   
    localScope.query = "";
  };

  // Handles filtered search
  localScope.advancedSearch = function(){
    if(localScope.filterForm.$invalid){
      $scope.showErrorAlert("One or more field is invalid or missing.");
      $scope.scrollTo("query");
      return;
    }

    localScope.filterParams.hasImg = localScope.hasImg.checked;

    PostModel.search(localScope.query, localScope.filterParams).then(function(res){
      if(res.status === "OK"){
        //log("Status: " + res.status);
      }
      else{
        if(res.status == "ZERO_RESULTS"){
          $scope.showErrorAlert("No results found.");
        }else{
          $scope.generalErrorAlert();
        }
      }
    }, $scope.generalErrorAlert);

    localScope.closeSearchFilter();
    localScope.filterForm.$setPristine();
    localScope.query = "";
    localScope.filterParams = {};
  };

  // Prepares information to be presented for selected post
  localScope.getDetails = function(){
    if($scope.selectedPost.images.length == 0){
      PostModel.getPostImages($scope.selectedPost.key).then(function(data){
        $scope.selectedPost.images = data;
        $ionicViewSwitcher.nextTransition('none');
        $window.location.href = '#/app/details';
      }, function(err){
        $scope.showErrorAlert(err);
      });
    }
  };

  // Get posts for MyPostView
  localScope.getMyPosts = function(){
    PostModel.getPosts(localScope.user.uid).then(function(data){
      var len = data. length;
      $scope.myPosts = data;
    }, function(err){
       $scope.generalErrorAlert();
    });
  };

  // Clean up when app is closed
  $scope.$on('$destroy',function cleanUp(event){
    AccountModel.offAuth();
    Firebase.goOffline();
    PostModel.geoQueryCancel();
  });

}]);