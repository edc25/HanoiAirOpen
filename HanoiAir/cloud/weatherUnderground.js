var _ = require('underscore');

var apiKey = 'f2a5478b6daf832a';

module.exports.getCurrentConditions = getCurrentConditions;

function getCurrentConditions(maxStations)
{
    maxStations = maxStations || 10;

    return Parse.Cloud.httpRequest({
      url: 'http://api.wunderground.com/api/' + apiKey+ '/geolookup/q/Vietnam/Hanoi.json'
    }).then(function(rawResponse){
        console.log('received ' + JSON.stringify(rawResponse.data));
        var response = rawResponse.data;

        var airportCodes = _.map(response.location.nearby_weather_stations.airport.station, function(s){return s.icao});
        var pwsCodes = _.map(response.location.nearby_weather_stations.pws.station, function(s){return s.id});

        airportCodes = _.filter(airportCodes, function(c){if (c){ return true} else{ return false}});
        pwsCodes = _.filter(pwsCodes, function(c){if(c) {return true} else {return false}});

        airportUris = _.map(airportCodes, function(c){return 'http://api.wunderground.com/api/'+apiKey+'/conditions/q/VS/'+c+'.json'});
        pwsUris = _.map(pwsCodes, function(c){return 'http://api.wunderground.com/api/'+apiKey+'/conditions/q/pws:'+c+'.json'});
        var allUris = airportUris.concat(pwsUris);
        promises = [];
        responses = [];
        console.log('going to request from ' + allUris.length + ' WU urls');
        for (var i = 0; i < allUris.length; i++)
        {
            console.log('requesting from ' + allUris[i]);
            promises.push(Parse.Cloud.httpRequest({url: allUris[i]}).then(function(weatherResponse){
                var wr = weatherResponse.data;
                if (wr.current_observation)
                {
                    var translated = translateCurrentConditions(wr.current_observation);
                    responses.push(translated);
                    return translated;
                }
                if (wr.response && wr.response.error && wr.response.error.type){
                    return Parse.Promise.error(wr.response.error.type);
                }
                return Parse.Promise.error('Unknown error in response: ' + weatherResponse.body)
            }));
        }

        return Parse.Promise.when(promises).then(function(success)
        {
            return responses;
        }, function(failure)
        {
            console.log('Failed to get from WU: ' + failure);
            return responses;
        });

    },
    function(errorResponse){
        console.log(errorResponse);
        return [];
    });
}

function translateCurrentConditions(wu)
{
    return {
        tempC: wu.temp_c,
        humidity : parseInt(wu.relative_humidity),
        rainHour : parseFloat(wu.precip_1hr_metric) || 0.0,
        rainDay : parseFloat(wu.precip_today_metric) || 0.0,
        pressure : parseFloat(wu.pressure_mb),
        windDegrees : wu.wind_degrees,
        windSpeed : wu.wind_kph,
        timestamp : new Date(wu.observation_epoch * 1000),
        source : 'wu',
        subSource : wu.station_id
    };
}