_ = require('underscore');


module.exports.calculateAqi = calculateAqi;
module.exports.getAqis = getAqis;


function calculateAqi()
{

    var now = new Date().getTime();
    var to = now - (1000 * 60 * 180);
    var taperStart = now - (1000 * 60 * 15);

    return getAverageMass(now,to, taperStart).then(function(particleMass){
      var aqi = massToAqi(particleMass);

      returnValue =  {
        particleMass: particleMass,
        aqi: aqi,
      };
      return returnValue;
    },
    function(reason){
      console.error('Could not get AQI: ' + JSON.stringify(reason));
    }  

  );
}



function massToAqi(mass)
{
  var bands = [
    [0,0],
    [12,50],
    [35.4,100],
    [55.4,150],
    [150.4,200],
    [250.4,300],
    [350.4,400],
    [500,500]];
  if (mass <= 0)
  {
    return 0;
  }

  for (i = 1; i < bands.length; i++)
  {
    if (mass <= bands[i][0])
    {
        var proportion = (mass - bands[i-1][0]) / (bands[i][0] - bands[i-1][0]);
        var range = (bands[i][1] - bands[i-1][1]);
        var aqi = range * proportion + bands[i-1][1];
        return aqi;
    }
  }
  return bands[bands.length-1][1];
}



function getAqis(latest,interval,count)
{
  return getAverageMasses(latest,interval,count).then(
    function(masses){
      return _.map(masses, massToAqi);
    });
}

function getAverageMass(latest, earliest, taperStart)
{
    taperStart = taperStart || -1;
    return getParticleMasses(latest,earliest).then(function(results){
      var cnt = results.length;
      var particleMass = 0;
      var totalFactor = 0;
      for (i = 0; i < results.length; i++)
      {
          var readingTime = results[i].timestamp;
          
          var factor = (readingTime < earliest || readingTime > latest) ? 0 : readingTime > taperStart ? 1 : (readingTime - earliest)/(taperStart - earliest);
          factor = factor * factor;
          particleMass = particleMass + results[i].concentration * factor;
          totalFactor += factor;
      }
      var particleMass = particleMass / totalFactor;
      return particleMass;
    });
}

function getAverageMasses(latest, interval, count)
{
  var earliest = latest - (interval * count);
  var masses = [];
  var counts = [];
  return getParticleMasses(latest,earliest).then(function(results){
    for (i  = 0; i < results.length; i++)
    {
      var bin = Math.floor((latest - results[i].timestamp)/interval);
      masses[bin] = (masses[bin] || 0) + results[i].concentration;
      counts[bin] = (counts[bin] || 0) + 1;
    }
    return _.map(masses, function(m,i) { return m / counts[i]});
  } );

  
}

function getParticleMasses(latest,earliest)
{
  var AirQualityReading = Parse.Object.extend("AirQualityReading");
    var query = new Parse.Query(AirQualityReading);

    query.addDescending('timestamp');
  //  query.equalTo('source','aqivn');
    //query.limit(16);
    query.greaterThanOrEqualTo('timestamp', new Date(earliest));
    query.lessThanOrEqualTo('timestamp', new Date(latest)); 
    return query.find().then(function(results){
      return _.map(results, function(r){ return {'timestamp': r.get('timestamp').getTime(), 'concentration' : r.get('concentration')} });
    });
}