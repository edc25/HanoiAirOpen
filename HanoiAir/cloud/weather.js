var wu = require('cloud/weatherUnderground.js');

Parse.Cloud.job('getWeather', function(request, status)
{
    Parse.Cloud.useMasterKey();
 
    return getAndStoreRawWeather().then(function(count){
        status.success('Saved ' + count +' values');
    },
    function(error){
        status.error('Failed to get weather: ' + error);
    });
});

function getAndStoreRawWeather()
{
    return wu.getCurrentConditions().then(function(weathers){
        var weatherReadings = [];
        var WeatherReading = Parse.Object.extend("WeatherReading");
        for (var i = 0; i < weathers.length; i++)
        {
            var weatherReading = new WeatherReading();
            var w = weathers[i];
            for (prop in w)
            {
                weatherReading.set(prop, w[prop]);
            }
            weatherReadings.push(weatherReading);
        }
        Parse.Object.saveAll(weatherReadings);
        return weathers.length;
    },
    function(error){
        console.error(error);
        return null;
    });
}
