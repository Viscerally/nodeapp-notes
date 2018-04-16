var request = require('request');

request({
  url: `https://api.github.com/users/jensen/repos`,
  qs: {
    sort: 'created',
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
