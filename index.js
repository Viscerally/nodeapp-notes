require('dotenv').config();

var request = require('request');
var moment = require('moment');

var weather = {
  'clear-day': '☀️',
  'clear-night': '🌙',
  'cloudy': '☁️',
  'fog': '🌁',
  'partly-cloudy-day': '⛅️',
  'partly-cloudy-night': '🌙',
  'rain': '☔️',
  'sleet': '❄️ ☔️',
  'snow': '❄️',
  'wind': '🍃',
  'error': '❗️'
};

function getWeather(day) {
  return {
    date: moment(day.time * 1000),
    icon: weather[day.icon] || '',
    high: Math.round(day.temperatureHigh),
    low: Math.round(day.temperatureLow)
  }
}

function onRetrieveWeather(error, response, body) {
  var data = JSON.parse(body);
  var week = data.daily.data.slice(0, 7);

  week.forEach(day => {
    var weather = getWeather(day);
    var date = weather.date.format('dddd, MMMM Do');

    console.log(`${date}\t\t${weather.low}° to ${weather.high}° ${weather.icon}`);
  });
}

function retrieveWeather(lat, long) {
  request({
    url: `https://api.darksky.net/forecast/${process.env.DARKSKY_SK}/${lat},${long}/`,
    qs: {
      units: 'ca'
    }
  }, onRetrieveWeather);
}

function onRetrieveLocation(error, response, body) {
  var data = JSON.parse(body);

  console.log(`Location: ${data.city}, ${data.region_code}`);

  retrieveWeather(data.latitude, data.longitude);
}

function retrieveLocation() {
  request({
    url: `http://api.ipstack.com/check`,
    qs: {
      access_key: process.env.IPSTACK_SK
    }
  }, onRetrieveLocation);
}

function legal() {
  console.log('Powered by Dark Sky');
  console.log('https://darksky.net/poweredby/');
  console.log('------------------------------');
}

legal();
retrieveLocation();
