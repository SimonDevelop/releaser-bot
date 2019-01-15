const config = require("./config.json");
const request = require('request');
const apiUrl = "https://api.github.com";

for (var i=0; i < config.repositories.length; i++) {
    var options = {
        url: apiUrl+"/repos/"+config.repositories[i],
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
}
