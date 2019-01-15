// const config = require("./config.json");
const request = require('request');
const apiUrl = "https://api.github.com";

var options = {
    url: apiUrl,
    headers: {
        'User-Agent': 'releaser-bot'
    }
};

function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        var info = JSON.parse(body);
        console.log(info);
    }
}

request(options, callback);
