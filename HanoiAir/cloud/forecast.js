var moment = require('cloud/moment.js');
var aqi = require('cloud/aqi.js');

module.exports.forecastThreeHours = forecastThreeHours;

function forecastThreeHours()
{
   var timestamp = Date.now();
   return aqi.getAqis(timestamp,1 * 60 * 60 * 1000, 9).then(
    function(aqis){
        var aqiFactors = [-0.1327820334, -0.1460805905,   0.0330270681,    0.0401303013, 0.0080526122, 0.0208118976, -0.0075214017, -0.0166711036, 0.1198047677];
        var hoursFactors = [4.2579288048, 5.033294595, 3.3179673631, 1.7631603188, -1.3890853075, -8.0733452104, -10.8624926725, -7.3442352925, 2.1214093763, 9.9384429567, 2.94, 1.7185120286];
        var daysFactors = [0.4722244217,1.3270259742, 0.1050711664, -0.2094515358, 0.8569520341, -0.0931931376, 0.9634355769];
        var constantFactor = 3.4220644999;

        var sum = 0;

        for (var i = 0; i < aqis.length; i++)
        {
            if (aqis[i] == undefined || aqis[i] == NaN)
            {
                console.log('undefined AQI at hour ' + i);
                return null;
            }

            sum = sum + aqis[i]*aqiFactors[i];
        }

        var forecastTimestamp = timestamp + (3+7) * 60 * 60 * 1000; // 3 hours in the future, then add 7 for the timezone so we can just call UTC methods, as we don't know the timezone of the server.
        var forecastTime = new Date(forecastTimestamp);
        var forecastDay = forecastTime.getUTCDay();
        var forecastHour = Math.floor(forecastTime.getUTCHours()/2);

        sum = sum + hoursFactors[forecastHour];
        sum = sum + daysFactors[forecastDay];

        sum = sum + constantFactor;

        return {'forecast': sum, 'forecastTime': new Date(timestamp + 3 * 60 *60*1000)};
    }   

    );

}