"use strict";

angular.module('rentalinsight.controllers')

.controller('PostCtrl', ['$scope', '$location', '$anchorScroll', 'PostModel', 'AccountModel', 'CameraService',
  function($scope, $location, $anchorScroll, PostModel,AccountModel, CameraService) {
    var localScope = this;
    var imageLimit = 6;
    $scope.postData = { images: [] };
    localScope.typeList = ["STUDIO","APARTMENT", "CONDO", "HOUSE", "OTHER"];
    localScope.bedBathRange = ['1', '2', '3', '4', '5+'];

    // Submits a post
    localScope.submitPost = function(){
      // Check field validity
      if(localScope.postForm.$invalid){
        $scope.showErrorAlert("One or more field is invalid or missing.");
        return;
      }
  
      $scope.postData.author = AccountModel.getSession().uid;

      // Add post to database
      PostModel.addPost($scope.postData).then(function(res){
        if(res.status == "SUCCESS"){
          AccountModel.indexPost(res.postKey);
          $scope.showSuccessAlert("Post was successfully added!");
        }else{
          $scope.generalErrorAlert();
        }
      },$scope.generalErrorAlert);
      $scope.postData = { images:[] };
      $scope.scrollTo('top');
      localScope.postForm.$setUntouched();
      localScope.postForm.$setPristine();
      localScope.reset(localScope.postForm);
    };

    // Delete a post
    localScope.deletePost = function(uid, key, index){
      var confirmTxt = "Are you sure you want to delete this post?";
      $scope.showConfirm(confirmTxt).then(function(yes){
        if(yes){
          PostModel.deletePost(uid, key);
          $scope.myPosts.splice(index,1);
          $scope.showSuccessAlert("Post deleted."); 
        }else{
          return;
        }
      });
    };

    // Get pictures from camera
    $scope.getPicture = function() {
      CameraService.getPicture().then(function(imgData) {
        if(isLessThanImgLimit()){
          $scope.postData.images.push("data:image/png;base64, " + imgData);
          $scope.getPicture();
        }else{
          $scope.showErrorAlert("Sorry, can only include " + imageLimit + " images max.")
        }
      }, function(err) {
        console.err(err);
      });
    };

    // Get pictures from album
   $scope.getPictureFromAlbum = function() {
      CameraService.getPictureFromAlbum().then(function(imgData) {
        if(isLessThanImgLimit()){
          $scope.postData.images.push("data:image/png;base64, " + imgData);
          $scope.getPictureFromAlbum();
        }else{
          $scope.showErrorAlert("Sorry, can only include " + imageLimit + " images max.")
        }
      }, function(err) {
        console.err(err);
      });
    };

    // Resets a form
    localScope.reset = function(form){
      form.$setPristine();
      form.$setUntouched();
      $scope.postData.images = [];
      $scope.scrollTo('top');
    };

    // Check number of allowed images
    function isLessThanImgLimit(){
      return $scope.postData.images.length < imageLimit ? true : false;
    }

}]);
