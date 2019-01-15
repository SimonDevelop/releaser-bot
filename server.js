const config = require("./config.json");
const request = require('request');
const apiUrl = "https://api.github.com";

var options = {
    url: apiUrl+"/repos/SimonDevelop/releaser-bot-test",
    headers: {
        'User-Agent': 'releaser-bot',
        'Authorization': 'token '+config.token
    }
};

function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        var info = JSON.parse(body);
        console.log(info);
    }
}

request(options, callback);
