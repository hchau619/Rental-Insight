angular.module('rentalinsight.models')

.factory('AccountModel',['$rootScope', '$q', '$firebaseAuth', function($rootScope, $q, $firebaseAuth){
	var Account  = {};
	var baseURL = "https://rentalinsight.firebaseio.com";
	var fbRef = new  Firebase(baseURL);
	var accRef = fbRef.child('accounts');
	var FbAuth = $firebaseAuth(fbRef);
	var session = {};	
	
	// Handles authentication state changes
	FbAuth.$onAuth(function(authData){
		if(authData)
			session = authData;
		else
			$rootScope.$broadcast('unauthenticated');
	});

	// Deauthorize session
	Account.offAuth = function(){
		FbAuth.offAuth();
	};

	// Get current session
	Account.getSession = function(){
		return session;
	};

	// Get current authorization
	Account.getAuth = function(){
		return FbAuth;
	};

	// Create an account
	Account.createAccount = function(credential){
		var q = $q.defer();
		FbAuth.$createUser({ "email": credential.email, "password": credential.password })
		.then(function(userData){
			userData.email = credential.email;
			indexAccount(userData);
		}, function(err){
			q.reject(err);
		});

		// Save account in app db
		function indexAccount(userData){
			// If account does not exist
			accRef.child(userData.uid).set({
	      email: userData.email
	    });
			q.resolve(userData)

		}

		return q.promise;
	};

	// Login into account
	Account.login = function(credential){
		return FbAuth.$authWithPassword({
			email: credential.email, 
			password: credential.password 
		});
	};

	Account.logout = function(){
		FbAuth.$unauth();
	};

	// Index posts created by user
	Account.indexPost = function(key){
		accRef.child(session.uid).child('posts').child(key).set(key);
	};

	return Account;
}]);