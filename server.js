const config = require("./config.json");
const http = require('http');
const request = require('request');
const EventEmitter = require("events").EventEmitter;
const data = new EventEmitter();
const API_URL = "https://api.github.com";

// Default request options
const options = {
    method: "GET",
    headers: {
        'Content-type': 'application/json',
        'User-Agent': 'releaser-bot',
        'Authorization': `token ${config.token}`
    }, json: true
};

// Server for webhooks
http.createServer((req, res) => {
    if (req.method !== 'POST') return res.end("Not found");
    let response = '';
    req.on('data', (d) => {
        response += d;
    });
    req.on('end', () => {
        try {
            const post = JSON.parse(response);
            if (post.ref == "refs/heads/master") {
                console.log(`webkhool detected for ${post.repository.full_name}`)
                checkRepos(post.repository.full_name);
            } else {
                console.log(`webhook detected for ${post.repository.full_name} but is not master branch`)
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.write('{"message": "Webhook received!"}');
            res.end();
        } catch (err) {
            console.log(err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.write('{"message": "Bad Post Data."}');
            res.end();
        }
    });
}).listen(9898, "0.0.0.0");


/**
 * Check repository
 * 
 * @param {String} name repertory name
 */
const checkRepos = (name) => {
    config.repositories.forEach((repository) => {
        if (name === repository) {
            options.url = `${API_URL}/repos/${repository}`;

            // Load repos

            request(options, (error, response, body) => {
                if (error || response.statusCode !== 200) return console.log("Reposiroty does not exist or unauthorized access");
                data.json = body;
                data.emit('commit');
            });
        }
    });
}

// Check last commit
data.on('commit', () => {
    options.url = `${API_URL}/repos/${data.json.full_name}/commits`;

    // Load last commit

    request(options, (error, response, body) => {
        if (error || response.statusCode !== 200) return console.log("last commit is not a new release");

        const regMessage = new RegExp(config.commitMessage, "gi");

        // check and compare commit sha
        if (body[0].commit.message.match(regMessage) != null
            && (typeof data.commit == "undefined" || data.commit != body[0].sha.substr(0, 6))) {
                
            // Generate release description
            const split = body[0].commit.message.split("\n\n");
            let array = [];
            data.titleCommit = split[0];
            if (split.length > 1) {
                split.forEach((artifact) => {
                    if (artifact === split[0]) return;
                    array.push(artifact);
                });
                data.description = array.join("\n\n");
            } else {
                data.description = '';
            }

            // Storage commit sha
            data.commit = body[0].sha.substr(0, 6);
            data.emit('release');
        }
    });
});

// Check last release
data.on('release', () => {
    options.url = `${API_URL}/repos/${data.json.full_name}/releases`;

    // Load last release
    
    request(options, (error, response, body) => {
        if (error || response.statusCode !== 200) return;
        data.releases = body;
        data.emit('create');
    });
});


// Create new release
data.on('create', function () {
    let newRelease = {};
    let lastRelease = '';
    if (data.releases.length > 0) {
        lastRelease = data.releases[0].tag_name;
        let splited = lastRelease.split(".");
        let major = parseInt(splited[0]);
        let minor = parseInt(splited[1]);
        let patch = parseInt(splited[2]);

        let regMessageMajor = new RegExp(config.major, "gi");
        let regMessageMinor = new RegExp(config.minor, "gi");
        if (data.titleCommit.match(regMessageMajor) != null) {
            major++;
            minor = 0;
            patch = 0;
        } else if (data.titleCommit.match(regMessageMinor) != null) {
            minor++;
            patch = 0;
        } else {
            patch++;
        }
        newRelease.tag = major + "." + minor + "." + patch;
        newRelease.name = "Release " + major + "." + minor + "." + patch;
    } else {
        newRelease.tag = "0.0.1";
        newRelease.name = "Release 0.0.1";
    }

    // Request for create new release
    options.method = "POST";
    options.url = `${API_URL}/repos/${data.json.full_name}/releases`;
    options.json = {
        "tag_name": newRelease.tag,
        "target_commitish": config.defaultBranch,
        "name": newRelease.name,
        "body": data.description,
        "draft": false,
        "prerelease": false
    };
    request(options, (error, response, body) => {
        if (error || response.statusCode !== 201) return console.log(`Creating ${newRelease.name} for ${data.json.full_name} is failed`)
        
        console.log(`${newRelease.name} for ${data.json.full_name} is created`);
    });
    options.method = "GET";
});
