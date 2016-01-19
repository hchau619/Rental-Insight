"use strict";

// Logging for Debug
var log = function(str){
  // Comment below to disable in production.
  //console.log(str);
}

var app = angular.module('rentalinsight', ['ionic','ngCordova', 'chart.js', 'ngMessages', 'rentalinsight.controllers','rentalinsight.models', 'rentalinsight.services'])

.run(['$ionicPlatform', '$rootScope', function($ionicPlatform, $rootScope) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }
  });

  // Redirect to home page if not logged in
  $rootScope.$on("$stateChangeError", function(event, next, previous, error) {
    log("$stateChangeError")
    if (error === "AUTH_REQUIRED") {
      $location.path("/home");
    }
  });

}])

.config(function($stateProvider, $urlRouterProvider,$ionicConfigProvider) {

  $stateProvider
  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'app/templates/menu.html',
    controller: 'AppCtrl as appCtrl',
    resolve: {
      "currentAuth": ["AccountModel", function(AccountModel) {
        // wait for authorization
        return AccountModel.getAuth().$waitForAuth();
      }]
    }
  })
  .state('app.home',{
    url: '/home',
    cache: true,
    templateUrl:'app/templates/home.html'
  })
  .state('app.newpost',{
    url: '/newpost',
    cache: false,
    templateUrl:'app/templates/new-post.html',
    controller: 'PostCtrl as postCtrl',
    resolve: {
      "currentAuth": ["AccountModel", function(AccountModel) {
        // Check authorization before load
        return AccountModel.getAuth().$requireAuth();
      }]
    }
  })
  .state('app.myposts',{
    url: '/myposts',
    cache: false,
    templateUrl:'app/templates/my-posts.html',
    controller: 'PostCtrl as postCtrl',
    resolve: {
      "currentAuth": ["AccountModel", function(AccountModel) {
        // Check authorization before load
        return AccountModel.getAuth().$requireAuth();
      }]
    }
  })
  .state('app.details',{
    url: '/details',
    cache: false,
    templateUrl:'app/templates/details.html',
    controller: 'DetailsCtrl as detailsCtrl'
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');

  // Removes previous title from back button
  $ionicConfigProvider.backButton.previousTitleText(false).text('');
  $ionicConfigProvider.navBar.alignTitle('center');
});



