const config = require("./config.json");
const http = require('http');
const request = require('request');
var EventEmitter = require("events").EventEmitter;
var data = new EventEmitter();
var apiUrl = "https://api.github.com";

// Default request options
var options = {
    method: "GET",
    headers: {
        'Content-type': 'application/json',
        'User-Agent': 'releaser-bot',
        'Authorization': 'token '+config.token
    }, json: true
};

// Server for webhooks
http.createServer(function (req, res) {
    if (req.method == 'POST') {
        var b = '';
        req.on('data', function (d) {
            b += d;
        });
        req.on('end', function () {
            try {
                var post = JSON.parse(b);
                console.log("webhook detected for "+post.repository.full_name);
                checkRepos(post.repository.full_name);
                res.writeHead(200, {"Content-Type": "application/json"});
                res.write('{"message": "Webhook received!"}');
                res.end();
            } catch (err) {
                console.log(err);
                res.writeHead(500, {"Content-Type": "application/json"});
                res.write('{"message": "Bad Post Data."}');
                res.end();
            }
        });
    } else {
        res.end('not found');
    }
}).listen(9898, "127.0.0.1");

// Check repos
function checkRepos(name) {
    for (var i=0; i < config.repositories.length; i++) {
        if (name == config.repositories[i]) {
            options.url = apiUrl+"/repos/"+config.repositories[i];
            // Charge repos
            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    data.json = body;
                    data.emit('commit');
                }
            });
        }
    }
}

// Check last commit
data.on('commit', function () {
    options.url = apiUrl+"/repos/"+data.json.full_name+"/commits";
    // Charge last commit
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var regMessage = new RegExp(config.commitMessage, "gi");
            if (body[0].commit.message.match(regMessage) != null) {
                data.commit = body[0].sha.substr(0, 6);
                data.emit('release');
            } else {
                console.log("last commit is not new release");
            }
        }
    });
});

// Check last release
data.on('release', function () {
    options.url = apiUrl+"/repos/"+data.json.full_name+"/releases";
    // Charge last release
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            data.releases = body;
            data.emit('create');
        }
    });
});

// Create new release
data.on('create', function () {
    var newRelease = {};
    var lastRelease = '';
    if (data.releases.length > 0) {
        lastRelease = data.releases[0].tag_name;
        var splited = lastRelease.split(".");
        var major = parseInt(splited[0]);
        var minor = parseInt(splited[1]);
        var patch = parseInt(splited[2]);

        var regMessageMajor = new RegExp("major", "gi");
        var regMessageMinor = new RegExp("minor", "gi");
        if (data.releases[0].body.match(regMessageMajor) != null) {
            major++;
        } else if (data.releases[0].body.match(regMessageMinor) != null) {
            minor++;
        } else {
            patch++;
        }
        newRelease.tag = major+"."+minor+"."+patch;
        newRelease.name = "Release "+major+"."+minor+"."+patch;
    } else {
        newRelease.tag = "0.0.1";
        newRelease.name = "Release 0.0.1";
    }

    // Request for create new release
    options.method = "POST";
    options.url = apiUrl+"/repos/"+data.json.full_name+"/releases";
    options.json = {
        "tag_name": newRelease.tag,
        "target_commitish": "master",
        "name": newRelease.name,
        "body": "",
        "draft": false,
        "prerelease": false
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(newRelease.name+" for "+data.json.full_name+" is created!");
        } else {
            console.log("Creating "+newRelease.name+" for "+data.json.full_name+" is failed!");
        }
    });
    options.method = "GET";
});
