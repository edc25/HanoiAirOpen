# HanoiAirOpen

All code is copyright (c) Edward Clayton 2016, all rights reserved.

Once I figure out what license is best, I intend to change this!

## Overview

### Terms

* Mass concentration - a way of measuring the raw amount of something in the air, in terms of mass (in our case micrograms per litre - ug/l).
* Particle count - a way of measuring the raw amount of something in the air by counting the number of particles we see.
* PM2.5 - Small particles, smaller than 2.5um. 
* AQI - A scale for comparing air quality in a number of dimensions. However, I only care about PM2.5 is it is now considered to be the most harmful type of pollution. It is a non-linear scale, and it is based on mass concentration - see  http://aqicn.org/faq/2013-09-09/revised-pm25-aqi-breakpoints/

### HanoiAir
HanoiAir is a Parse.com application, written in Javascript (not node.js, but it should be reuseable)

It takes data from AQIVN and from the US Embassy. AQIVN is responsive, but they provide raw data as particle counts (particles/cubic foot), which need to be converted into a mass concentration (ug/litre). There are more theoretical ways of doing this, but I took an empirical approach. I correlated AQIVN figures with US Embassy ones; dividing particle count by about 200 gives us a decent estimate of concentration. I also refer to particle counts as a Dylos count - Dylos being the brand of particle counter AQIVN use.

I believe the US Embassy data to be an hourly average mass concentration over the hour ending at a given timestamp. I therefore store this as a single reading half an hour before the timestamp they give.

We then combine the various readings over the last three hours or so, to give an approximate weighted average concentration. This is then converted into the AQI scale detailed here: http://aqicn.org/faq/2013-09-09/revised-pm25-aqi-breakpoints/ (I don't believe AQI to be a particularly good scale for measuring PM2.5 concentration in Hanoi, because it heavily compresses the Unhealthy range, but it's what everyone uses so I stuck with it). I'm doing this in a naive way which heavily favours AQIVN readings because they're being taken every 15 minutes so there are four times as many of them. I think this is bad, but it is a start.

I've made a start on forecasting, based solely on past readings. I've made some more progress in this area since, although I've not committed that code yet as there's some non-open data that isn't mine to share publically. I'm also trying to derive a better method of converting Dylos counts to mass concentrations.

I also store weather data from Weather Underground. Not doing much with it yet.

### HanoiAirDroid
HanoiAirDroid is a Xamarin solution, targetting only Android at the moment.

I'm using Xamarin because I'm more familiar with it and it was easier to get something working that way. Unfortunately the solution does currently require a Xamarin Indie license to build, but I think I can get around this - see TODOs later.

The app communicates over Parse, and doesn't have much logic in it. We use push messaging to get updates and show notifications. The big refresh button just does a standard async call to Parse.

I use the Android native UI, so the AXMLs should be a little more familiar anyway.

## TODO

* Consider moving away from Parse. It provides easy GCM messaging, but including the Parse DLL blows the Xamarin app over the starter size limit. An alternative would be to abstract away the Parse.com bits into a separate library that I can include when building, and that contributors can mock out. It will be necessary to either move away from Parse.com, or run a separate instance of it in any case as Parse will shut down in January 2017.
* Consider the future of the Xamarin app. I've no real objection to a full rewrite in Java if it means I can get more people involved (although I prefer C#)
* Nicer UI
* Show past data on the UI, and perhaps give users the option of more heavily weighting the US or AQIVN sources (or showing that, say, AQIVN is comparatively high and that therefore Tay Ho is maybe worse than Ba Dinh).
* Vietnamese translation
* Better forecasting
* Ho Chi Minh City data
* Include the Long Bien government sensor data.

## Comments

I think this is a better way of giving air quality information that relying either on AQIVN or the US Embassy. AQIVN has great uptime, but there's only a single sensor and as such it's hard to know exactly how to convert that data into mass concentration and from there into AQI. The US Embassy is probably accurate - they have the resources to buy an expensive bit of kit and keep it calibrated. But their data is, I think, lagged by about an hour (half an hour because it's an hourly average, and another half hour because it seems to take that long to arrive). Air Quality in Hanoi can change by a factor of two in an hour.
