angular.module('rentalinsight.services')

.factory('CameraService', ['$q','$cordovaImagePicker', function($q,$cordovaImagePicker) {

  return {
    // Get a picture from camera
    getPicture: function(options) {
      var q = $q.defer();
      var options = {
        saveToPhotoAlbum: false,
        quality: 50,
        destinationType: Camera.DestinationType.DATA_URL,  // Return image as base64-encoded string
        sourceType : Camera.PictureSourceType.CAMERA,
        targetWidth: 600,
        targetHeight: 600
      }

      navigator.camera.getPicture(function(result) {
        q.resolve(result);
      }, function(err) {
        q.reject(err);
      }, options);

      return q.promise;
    },

    // Get a picture from album
    getPictureFromAlbum: function(options) {
      var q = $q.defer();
      var options = {
        saveToPhotoAlbum: false,
        quality: 50,
        destinationType: Camera.DestinationType.DATA_URL,  // Return image as base64-encoded string
        sourceType : Camera.PictureSourceType.SAVEDPHOTOALBUM,
        targetWidth: 600,
        targetHeight: 600
      }

      navigator.camera.getPicture(function(result) {
        q.resolve(result);
      }, function(err) {
        q.reject(err);
      }, options);

      return q.promise;
    },
   };
}]);
