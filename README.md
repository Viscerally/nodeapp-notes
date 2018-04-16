# Applications with Node JS

Notes and slides available at [https://github.com/jensen/nodeapp-notes/](https://github.com/jensen/nodeapp-notes/)

This lesson allows you to see how a developer approaches building a small Node application. The application should access an existing API using the request library. We want to refactor the app so that it follows best practices.

## The ENVironment

Your operating system will run processes within an environment. A user or administrator can set [variables within the environment](https://en.wikipedia.org/wiki/Environment_variable). On a UNIX system these variables can be set using various techniques.

You can list the current environment variables by using the command `export`. One way to set a variable is to use the command `export KEY=VALUE`. This variable will only be set for the terminal session that it executed within.

Another common technique is to set an environment variable when running a process.

`KEY=VALUE node script.js`

### Separating Code and Config

Web applications separate their code and config. I should be able to share the source code, while keeping the configuration of the application separate. Each developer on a team may need to provide a different configuration. It is also common to change the configuration based on the deployment of the application.

An example of this is using a different database for development vs production.

The co-founder of Heroku published information on web application best practices. It is called 'The Twelve Factor App' and includes a section on [configuration](https://12factor.net/config). A lot of the material will be too advanced for this early in the program. As you become more familiar with building web applications, the twelve factor app criteria will make more sense to you.

### Secrets

Some of the configuration should be kept private. We often need to include secret keys, tokens and passwords in our code. You do not want to publish this confidential information to a publicly accessible server. The separation of code and configuration supports this goal.

### Using the dotenv library

The dotenv library provides a good solution to separating code and config. The [dotenv](https://github.com/motdotla/dotenv) library allows you to create a file named `.env` in the root directory of your project.

__.env__
```
GITHUB_TOKEN=bd04b7dc42d9a29...
```

Now gain access to the GITHUB_TOKEN variable in a node application. It is a good idea to configure dotenv at the top of your file. Once this action is taken, you will have access to the variables defined in `.env`.

```javascript
require('dotenv').config();

const access_token = process.env.GITHUB_TOKEN;
```

### using .gitignore

Keeping code and configuration separate allows us to hide our configuration while still being able to share the source code. We use a `.gitignore` file to exclude certain files from our version control system.

This means that everyone who wants to run the application would need their own .env file. It's a good idea to create a `.env.example` file that you do commit. This will allow you to inform other developers of the environment variables that have to be set.

__.env.example__
```
GITHUT_TOKEN=
DARKSKY_SK=
IPSTACK_SK=
DB_USERNAME=
DB_PASSWORD=
```

Now a new developer would `cp .env.example .env` and fill in the values with their own credentials. The app would load their .env file and use the variables contained for it's configuration.

## Using the request library

We choose to use the [request library](https://github.com/request/request) instead of nodes `http` library. It provides a more direct interface to make common requests.

### Simple requests

```javascript
request(`https://api.github.com/users/jensen/repos`, function(error, response, body) {
  console.log(body);
});
```

With this example, we make a `GET /users/jensen/repos` request to api.github.com. Once the server returns the response, the request library executes the callback function. The body variable contains [JSON](https://developer.github.com/v3/repos/#response).

### Advanced requests

The request function can also take an object representing the request we want to make. A list of all possible options can be found in the [request documentation](https://github.com/request/request#requestoptions-callback). With this configuation we want to sort the repos starting with the newest. In order to increase the number of calls that can be made, an `access_token` is provided. Since this is a `GET` request we cannot send body data. We use a [query string](https://en.wikipedia.org/wiki/Query_string) to pass data to the server.

First test your request using curl. This way we can rule out any bugs due to an incorrect request.

`curl 'https://api.github.com/users/jensen/repos?sort=created&direction=desc&access_token=<GITHUB_TOKEN>' | more`

> I've used the [more](https://en.wikipedia.org/wiki/More_(command)) command for convenience when reading the response data.

Once you have confirmed that the request is well formed, you can translate it into JavaScript code.

```javascript
require('dotenv').config();

request({
  url: `https://api.github.com/users/jensen/repos`,
  qs: {
    sort: 'created',
    direction: 'desc',
    access_token: process.env.GITHUB_TOKEN
  },
  headers: {
    'user-agent': 'node application'
  }
}, function(error, response, body) {
  var repos = JSON.parse(body);

  repos.forEach(function(repo) {
    console.log(repo.name);
  });

  console.log(repos.length + ' repos');
});
```

[Github User-Agent Required](https://developer.github.com/v3/#user-agent-required)

If the `User-Agent` header isn't included then Github will respond with a 403 Forbidden error. Adding it yourself as a header will fix this.

## A Node Application

The requirements for our node application are:

1. Retrieve the _location_ of the user making the request.
2. Use the retrieved latitude and longitude to make a request for the _weather_ at that location.

There are many options when it comes choosing an API for common types of data.

Weather API

- [OpenWeatherMap](https://openweathermap.org/api)
- [Yahoo Weather](https://developer.yahoo.com/weather/)
- __[Dark Sky](https://darksky.net/dev)__ _(1,000 requests/day)_

Location API

- [ipinfo.io](https://ipinfo.io/)
- [ipapi.co](https://ipapi.co/)
- __[ipstack](https://ipstack.com/)__ _(10,000 requests/month)_

This example uses Dark Sky for the weather API and ipstack for the IP Location API. Once you register for an account you are provided with a limited number of requests within a timeframe. This is normal for free accounts. If your app needs more requests you would pay for them.

### Making the Location Request

```javascript
request({
  url: `http://api.ipstack.com/check`,
  qs: {
    access_key: process.env.IPSTACK_SK
  }
}, onRetrieveLocation);
```

The [documentation](https://ipstack.com/documentation) for ipstack gives us three endpoints. We can do a standard lookup, where we provide an IP to get the location for. There is the option to do a bulk lookup, where we provide multiple addresses to lookup. We want to use the requester lookup. This gives us the location for the IP that the request was made from.

The required query string parameter is the `access_key`. This is stored in the `.env` file and can be retrieved through the `process.env` object.

### Making the Weather Request

```javascript
request({
  url: `https://api.darksky.net/forecast/${process.env.DARKSKY_SK}/${lat},${long}/`,
  qs: {
    units: 'ca'
  }
}, onRetrieveWeather);
```

The [documentation](https://darksky.net/dev/docs) for Dark Sky has two endpoints. A forecast request gives us information about the future weather. The time machine request will allow us to get historical weather data for a specific date.

To make things simple, we use Canadian units of measurement. If we wanted to make this application more advanced we would determine the type of units based on geolocation and make our weather request based on that. For now we can pass the location and the API key as parameters on the url.

### Dealing with Dates

The weather api provides the date and time for the forecast as [UNIX time](https://en.wikipedia.org/wiki/Unix_time). We can use the built in [JavaScript Date API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date). An even easier approach is to use the [momentjs](https://momentjs.com/) library.

Moment.js can be called with a parameter that represents the date as a [timestamp in milliseconds](https://momentjs.com/docs/#/parsing/unix-timestamp-milliseconds/).

```javascript
console.log(moment(1523084400 * 1000).format("dddd, MMMM Do YYYY, h:mm:ss a"));
// Saturday, April 7th 2018, 12:00:00 am
```

The documentation for Dark Sky states that the times are all 'UNIX time'. This means that in order to use it with moment we need to multiply the number by 1000 to convert it to milliseconds. The other option is to use the specific [UNIX time](https://momentjs.com/docs/#/displaying/unix-timestamp/) method provided by moment `moment.unix(1523084400)`.

## Bonus

I've included the source code to another example where [IBM Watson](https://www.ibm.com/watson/developercloud/language-translator/api/v2/) is used to translate english text to spanish.

If you run this script without providing the correct credentials then it will return an error saying that you are 'Not Authorized'. Register for an account with [IBM Cloud](https://console.bluemix.net/catalog/services/language-translator). Once you have done that you can create a new username and password for the translator service from the [dashboard](https://console.bluemix.net/dashboard/apps).

Following the format in `.env.translate.example` alter your `.env` file to contain the correct variables.

When running the script again you should get the expected spanish output.