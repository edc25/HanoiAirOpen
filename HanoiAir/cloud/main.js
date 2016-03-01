var _ = require('underscore');
var sax = require('cloud/sax.js');
var xmlReader = require('cloud/xmlparser.js');
var forecast = require('cloud/forecast.js');
var aqi = require('cloud/aqi.js');
var weather = require('cloud/weather.js');

function dylosCountToConcentration(count, humidity)
{
	//return  count/1000 * 4.37 - (humidity-80)*count*0.0190/1000
	return count / 200;
}

// Changes XML to JSON
function xmlToJson(xml) {
	
	// Create the return object
	var obj = {};

	if (xml.nodeType == 1) { // element
		// do attributes
		if (xml.attributes.length > 0) {
		obj["@attributes"] = {};
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
			}
		}
	} else if (xml.nodeType == 3) { // text
		obj = xml.nodeValue;
	}

	// do children
	if (xml.hasChildNodes()) {
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;
			if (typeof(obj[nodeName]) == "undefined") {
				obj[nodeName] = xmlToJson(item);
			} else {
				if (typeof(obj[nodeName].push) == "undefined") {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(xmlToJson(item));
			}
		}
	}
	return obj;
};

function aqiToDescription(aqi)
{
	if (aqi < 70)
	{
		return 'good';
	}
	if (aqi < 150)
	{
		return 'poor';
	}
	if (aqi < 200)
	{
		return 'bad';
	}
	return 'terrible';
}

function sendAqiAlert(aqi, particleMass, lastAqi, lastParticleMass)
{
	console.log("Sending AQI alert for aqi of " + aqi);
	var message = aqi > lastAqi ? 'Air quality has got worse and is now ' + aqiToDescription(aqi) : 'Air quality has improved and is now ' + aqiToDescription(aqi);
	var title = aqi > lastAqi ? 'Air Quality Warning' : 'Air Quality Improvement';
	return Parse.Push.send({
		channels: ['AQIAlerts'],
		data: {
			aqi: aqi,
			particleMass: particleMass,
			lastAqi: lastAqi,
			lastParticleMass: lastParticleMass,
			alert: message,
			title: title
		}
	},{
		success: function(){
			console.log("Sent AQI Alert");
		},
		error: function(error){
			console.error("Failed to send alert: " + error);
		}
	});
}

function areOtherSidesOfBoundary(x,y,b)
{
	return (x - b) * (y - b) < 0;
}

function sendAqiAlertIfAppropriate()
{
	var AirQualityCalculation = Parse.Object.extend("AirQualityCalculation");
	var query = new Parse.Query(AirQualityCalculation);
	query.limit(2);
	query.descending("createdAt");
	return query.find().then(
		function(results)
		{
			if (results.length == 2)
			{
				if (areOtherSidesOfBoundary(results[0].get('aqi'),results[1].get('aqi'),200)
				   ||areOtherSidesOfBoundary(results[0].get('aqi'),results[1].get('aqi'),150)
				   ||areOtherSidesOfBoundary(results[0].get('aqi'),results[1].get('aqi'),70))
				{
					return sendAqiAlert(results[0].get('aqi'),results[0].get('particleMass'), results[1].get('aqi'),results[1].get('particleMass'));
				}
			}
		}
	);
	
};
Parse.Cloud.define("sendAqiAlert", function(request,response){
	console.log("sending Aqi Alert " + request);
	sendAqiAlertIfAppropriate(request.params.aqi, request.params.particleMass, request.params.lastAqi, request.params.lastParticleMass).then(
		function(){
			response.success("sent");
		},
		function(reason){
			response.error("failed: " + reason);
		}
	);
	
});
Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});

Parse.Cloud.define("getAQI", function(request, response){
	aqi.calculateAqi().then(function(aqi){
		
	  response.success(aqi);
	},
	function(reason){

		response.error('Failed to get AQI: ' + reason);
	});
});

Parse.Cloud.afterSave("AirQualityReading", function(request){

    Parse.Cloud.useMasterKey();
	aqi.calculateAqi().then(function(aqi){
		var AirQualityCalculation = Parse.Object.extend("AirQualityCalculation");
		var calc = new AirQualityCalculation();
		calc.set('aqi',aqi.aqi);
		calc.set('particleMass',aqi.particleMass);
		calc.save();
		sendAqiAlertIfAppropriate();
	});
})

Parse.Cloud.job("forecast", function(request, status){

    Parse.Cloud.useMasterKey();
    forecast.forecastThreeHours().then(function(forecastResult){
        var Forecast = Parse.Object.extend("Forecast");
        var forecast = new Forecast();
        forecast.set('forecast', forecastResult.forecast);
        forecast.set('forecastTime', forecastResult.forecastTime)
        forecast.save();
        status.success('Forecast with value: ' + JSON.stringify(forecastResult) );
    },
    function(error){
        status.error('Forecast failed: ' + error);
    });
})

Parse.Cloud.job("aqivn", function(request, status) {
  // Set up to modify user data
  Parse.Cloud.useMasterKey();
  var counter = 0;
 

  Parse.Cloud.httpRequest({
    url: 'http://www.aqivn.org/rawdata.txt.php'
  }).then(function(response){
    var AirQualityReading = Parse.Object.extend("AirQualityReading");
    var lines = response.text.split('\n');
    var line = lines[1].split(',');
    var pcount = parseInt(line[0]) - parseInt(line[1]);

    var entry = new AirQualityReading();
    entry.set('rawValue', pcount);
    entry.set('source', 'aqivn');
    entry.set('concentration', dylosCountToConcentration(pcount, 0.75));
    entry.set('timestamp', new Date());
    entry.save();
    status.success('Found value: ' + pcount);
  },function(httpResponse) {
    // error
    console.error('Request failed with response code ' + httpResponse.status);
    status.error(httpResponse.status);
  });
});

Parse.Cloud.job("usEmbassy", function(request, status) {
  // Set up to modify user data
  Parse.Cloud.useMasterKey();
  var counter = 0;
 
  var httpCall = Parse.Cloud.httpRequest({
    url: 'http://stateair.net/dos/RSS/Hanoi/Hanoi-PM2.5.xml'
  });
  var AirQualityReading = Parse.Object.extend("AirQualityReading");
  
  var query = new Parse.Query(AirQualityReading);
  query.addDescending('timestamp');
  query.equalTo('source','usembassy');
  query.limit(200);
  var qp = query.find();
  var count = 0;
  return Parse.Promise.when(httpCall,qp).then(function(response, vals){
	console.log(response);
    console.log(response.text);
	var toSave = [];
    xmlReader.read(response.text, function(err,res){
		var readings = res.rss.channel.item;
		
		for (i = 0; i < readings.count(); i++)
		{
			var item = readings.at(i);
		
			var utcDate = new Date(item.ReadingDateTime.text() + ' +0700');
            utcDate.setUTCMinutes(utcDate.getUTCMinutes() - 30); // It's an average of the last hour, so put it 30 minutes earlier.
			if (_.find(vals, function(v){ return v.get('timestamp').getTime() == utcDate.getTime(); }) == null)
			{
				if (parseFloat(item.Conc.text()) > 0)
				{
				    var entry = new AirQualityReading();
				    entry.set('rawValue', parseFloat(item.Conc.text()));
				    entry.set('source', 'usembassy');
				    entry.set('concentration', parseFloat(item.Conc.text()));
				    entry.set('timestamp', utcDate);
	    			toSave.push(entry);
					count++;
					if (count > 5)
					{
					//	break;
					}
			    }
		   }
	    }
	});
	if (toSave.length > 0)
	{
		Parse.Object.saveAll(toSave).then(function(results){
			status.success('Saved ' + toSave.length + ' values');
		},function(error){
			status.error('Failed saving: ' + error.message);
		});
	}
	else
	{
        status.success('Saved 0 values');
    }
  },function(httpResponse) {
    // error
  var AirQualityReading = Parse.Object.extend("AirQualityReading");

    console.error('Request failed with response code ' + httpResponse.status);
    status.error(httpResponse.status);
  });
});