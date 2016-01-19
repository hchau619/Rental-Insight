/*********************************************************/
/* Author: Hung Chau
/* 
/* Crimedata, a component of the RentalInsight application
/* responsible for collecting crime data.
/*            
/*********************************************************/

var sleeper = require('sleep');
var fs = require('fs');
var unzip = require('unzip');
var RSVP = require('rsvp');
var url = require('url');
var exec = require('child_process').exec;
var http = require('http');
var Firebase = require('firebase');
var GeoFire = require('geofire');
var geocodeBaseUrl = "http://maps.googleapis.com/maps/api/geocode/json?address=";
var region = "&region=us";
var baseURL = "https://rentalinsight.firebaseio.com";
var dataURL = "http://www.sandag.org/programs/public_safety/arjis/CrimeData/crimedata.zip";
var fbRef = new Firebase(baseURL);
var geoFire = new GeoFire(fbRef.child('crime_locations'));
var crimeRef = fbRef.child('crimes');
var Converter = require('csvtojson').Converter;
var converter = new Converter({ constructResult:true, workerNum:1 });
var crimeData;
var totalUploaded = 0;

// Downloads zip file from Automated Regional Justice Information System (AJIS) containing crime data.                        
function getData(fileUrl) {
	// extract file name
  var filename = url.parse(fileUrl).pathname.split('/').pop();
  // compose wget command
  var wget = "wget -O crimedata.zip " + fileUrl;
  // excute wget
  exec(wget, function(err, stdout, stderr) {
      if (err){
      	throw err;
      }else{
      	console.log(filename + ' downloaded');
      	unzipFile(filename);
      } 
  });
}

// Unzips csv file and pipe it to be converted into json                      
function unzipFile(filename){
	// Read zip file
	fs.createReadStream(filename)
	// Unzip file
  .pipe(unzip.Parse())
  .on('entry', function (entry) {
   	// Pipe to converter to parse csv file  
    entry.pipe(converter);
  });
}

// Insert a record into FireBase                      
function insertFireBase(record){	
	var addr = {
		"blockAddress" : record.BLOCK_ADDRESS,
		"community": record.community,
		"zipcode": record.ZipCode
	};

  getLatLng(addr).then(function(res){
  	if(res.status != "OK"){
  		console.log( res.error_message);
  		return;		
  	}
  	var coord = [];	
		coord[0] = res.results[0].geometry.location.lat;
		coord[1] = res.results[0].geometry.location.lng;
		record.location = coord;
		console.log(coord);
		
		// Push new record to Firebase
		var ref = crimeRef.push(record);
		
		// If push was success, index the location
		if(ref){
			setLocation(ref.key(),coord);
			totalUploaded++;
		}
	}, function(err){
		console.log(err);
	});
}

// Index a record location for later use with geoFire                   
function setLocation(key,coord){
	geoFire.set(key,coord).then(function() {
	  console.log("Provided key has been added to GeoFire");
	}, function(error) {
	  console.log("Error: " + error);
	});
};

// Formats an address str for geocode url                    
function urlFormat(str){
	var result = str.split(" ");
	if(result.length === 1){
		return result[0];
	}
	return result.join('+');
}


// Gets the longtitude and latitude of an address                      
function getLatLng(addr){
	var promise = new RSVP.Promise(function(resolve, reject){
		var address = '';
		
		// Make sure addr is not empty
		if(addr == null || addr == ""){
			reject({error: "EMPTY_ADDRESS"});
		}
		
		// Compose address string
		if(typeof addr === "object"){
			for (var key in addr){
				if(addr.hasOwnProperty(key) && addr[key] != null){
					address += addr[key] + " ";
				}
			}
		}

		var url = geocodeBaseUrl+address+region;
		
		// Get the the latitude and longtitude
		http.get(url,function(res){
			var body = '';

      res.on('data', function(d) {
          body += d;
      });
      res.on('end', function() {
        var parsed = JSON.parse(body);
        resolve(parsed);
      });
      res.on('error',function(e){
      	reject(e);
      });
		});	
	});

	return promise;
};


// Cancels an interval loop                      
function myClearInterval(interval){
	clearInterval(interval);
}

// Get new records                     
function getPreviousWeekCrimes(crimeArray){
	var dailyLimit = 2500;	// Google's Geocode service as a daily limit of 2500 requests.
	var perSecLimit = 10;		// Google's Geocode service as a 10 request limit per second.
	var dailyCount = 0;
	var len = crimeArray.length;
	var today = Date.now();
	var MILLISECS_PER_DAY = 86400000;
	var startTime = today - MILLISECS_PER_DAY * 7;
	var newQueue = [];

	// Extract new records
	for(var i = 0; i < len; i++){
		if(i % 1000 == 0) console.log("Proccessing entry: " + i);

		var time = Date.parse(crimeArray[i].activityDate);
		
		// only insert new entries since last week
		if(time > startTime){
			newQueue.push(crimeArray[i]);
		}
	}

	var qlen = newQueue.length;
	var k = 0;
	var interval = setInterval(uploadNewRecords, 1);

	function uploadNewRecords(){
		for(var j = 0; j < perSecLimit && k < qlen ; j++){	
			console.log(k + " " + newQueue[k].activityDate);
			insertFireBase(newQueue[k]);
			dailyCount++;
			k++;
			
			// Check limits
			if(dailyCount > dailyLimit){
				console.log("Daily limit reached! Going to sleep now.")
				dailyCount = 0;
				// sleep for 24hrs
				sleeper.sleep(86400); 
				console.log("I am awake!")
			}
		}

		if(k >= qlen){
			console.log("All entries have been processed!")
			myClearInterval(interval);
			console.log("Total Uploaded: " + totalUploaded);
		}
	}
	
};

/*********************************************************/
/* MAIN EXECUTION AREA          
/*********************************************************/	


getData(dataURL);

// Listener that detects when csv file is converted into json
converter.on("end_parsed", function (jsonArray) {
  getPreviousWeekCrimes(jsonArray);
});

// Handles unexpected operation errors. 
process.on('uncaughtException', function(err) {
  console.log(err);
  // Avoid service request limits by waiting for previous requests to finish
  sleeper.sleep(10);
});