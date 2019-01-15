const config = require("./config.json");
const request = require('request');
var EventEmitter = require("events").EventEmitter;
var data = new EventEmitter();
var apiUrl = "https://api.github.com";

for (var i=0; i < config.repositories.length; i++) {
    // Default options
    var options = {
        url: apiUrl+"/repos/"+config.repositories[i],
        headers: {
            'Content-type': 'application/json',
            'User-Agent': 'releaser-bot',
            'Authorization': 'token '+config.token
        }, json: true
    };

    // Check repos
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            data.json = body;
            data.emit('update');
        }
    });
}

// Check last release
data.on('update', function () {
    options.url = apiUrl+"/repos/"+data.json.full_name+"/releases"

    // Charge last release
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            data.releases = body;
            data.emit('release');
        }
    });
});

data.on('release', function () {
    console.log(data.releases);
    // if (releases.length > 0) {
    //     lastRelease.tag = releases[0].tag_name;
    //     lastRelease.name = releases[0].name;
    // } else {
    //     lastRelease.tag = "0.0.1";
    //     lastRelease.name = "Release 0.0.1";
    // }
});
