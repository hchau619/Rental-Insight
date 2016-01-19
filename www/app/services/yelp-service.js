angular.module('rentalinsight.services')

.factory('YelpService', ['$http', '$q', function($http, $q) {

  var consumerSecret = '<your consumer secret>'; 
  var tokenSecret = '<your token secret>'; 
  var oauthConsumerKey = '<your oauth consumer key>'; 
  var oauthToken = '<your oauth token>';
  var oauthSignatureMethod = "HMAC-SHA1";
  var radius = 1600; //1 mile
  var alphaNum = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'; 
  var defaultLimit = 10;
 

  function randomString(length, chars) {
      var result = '';
      for (var i = length; i > 0; --i){
        result += chars[Math.round(Math.random() * (chars.length - 1))];
      }

      return result;
  }

  return {
    // Get data from yelp search api
    "searchAPI": function(moreParams) {
        var method = 'GET';
        var url = 'http://api.yelp.com/v2/search?callback=JSON_CALLBACK';
        var params = {
                callback: 'angular.callbacks._0',
                oauth_consumer_key: oauthConsumerKey, 
                oauth_token: oauthToken, 
                oauth_signature_method: "HMAC-SHA1",
                oauth_timestamp: new Date().getTime(),
                oauth_nonce: randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'),
                sort: 1,
                limit:10
            };

        for(var key in moreParams){
          params[key] = moreParams[key];
        }

        var signature = oauthSignature.generate(method, url, params, consumerSecret, tokenSecret, { encodeSignature: false});
        params['oauth_signature'] = signature;
        
        return $http.jsonp(url, {params: params});
    }
  }
}]);
