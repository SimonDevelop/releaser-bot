const config = require('./config.json');
const http = require('http');
const request = require('request');
const EventEmitter = require('events').EventEmitter;
const data = new EventEmitter();
const API_URL = 'https://api.github.com';

// Default request options
const options = {
    method: 'GET',
    headers: {
        'Content-type': 'application/json',
        'User-Agent': 'releaser-bot',
        'Authorization': `Bearer ${config.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Accept': 'application/vnd.github+json',
    }, json: true
};

// Server for webhooks
http.createServer((req, res) => {
    if (req.method !== 'POST') return res.end('Not found');
    let response = '';
    req.on('data', (d) => {
        response += d;
    });
    req.on('end', () => {
        try {
            const post = JSON.parse(response);
            if (post.ref == `refs/heads/${post.repository.default_branch}`) {
                console.log(`webkhool detected for ${post.repository.full_name}`)
                checkRepos(post.repository.full_name);
            } else {
                console.log(`webhook detected for ${post.repository.full_name} but is not ${post.repository.default_branch} branch`)
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write("{'message': 'Webhook received!'}");
            res.end();
        } catch (err) {
            console.log(err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.write("{'message': 'Bad Post Data.'}");
            res.end();
        }
    });
}).listen(config.port, config.ip);


/**
 * Check repository
 *
 * @param {String} name repository name
 */
const checkRepos = (name) => {
    config.repositories.forEach((repository) => {
        if (name === repository) {
            options.url = `${API_URL}/repos/${repository}`;

            // Load repos

            request(options, (error, response, body) => {
                if (error || response.statusCode !== 200) return console.log('Reposiroty does not exist or unauthorized access');
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
        if (error || response.statusCode !== 200) return console.log('last commit is not a new release');

        const regMessage = new RegExp(config.commitMessage, 'gi');

        // check and compare commit sha
        if (body[0].commit.message.match(regMessage) != null
            && (typeof data.commit == 'undefined' || data.commit != body[0].sha.substr(0, 6))) {

            // Generate release description
            const split = body[0].commit.message.split('\n\n');
            let array = [];
            data.titleCommit = split[0];
            if (split.length > 1) {
                split.forEach((artifact) => {
                    if (artifact === split[0]) return;
                    array.push(artifact);
                });
                data.description = array.join('\n\n');
            } else {
                data.description = '';
            }

            // Storage commit sha
            data.commit = body[0].sha.substr(0, 6);
            data.fullCommit = body[0].sha;
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
        let splited = lastRelease.split('.');
        let major = parseInt(splited[0]);
        let minor = parseInt(splited[1]);
        let patch = parseInt(splited[2]);

        let regMessageMajor = new RegExp(config.majorTerm, 'gi');
        let regMessageMinor = new RegExp(config.minorTerm, 'gi');
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
        newRelease.tag = `${major}.${minor}.${patch}`;
        newRelease.name = `${config.releasePrefix} ${major}.${minor}.${patch}`;
    } else {
        newRelease.tag = '0.0.1';
        newRelease.name = `${config.releasePrefix}0.0.1`;
    }

    // Request for create new tag
    options.method = 'POST';
    options.url = `${API_URL}/repos/${data.json.full_name}/git/tags`;
    options.json = {
        'tag': newRelease.tag,
        'message': newRelease.tag,
        'object': data.fullCommit,
        'type': 'commit'
    };
    request(options, (error, response, body) => {
        if (error || response.statusCode !== 201) return console.log(`Creating ${newRelease.tag} for ${data.json.full_name} is failed`)

        console.log(`${newRelease.name} for ${data.json.full_name} is created`);

        // Request for create new release
        options.method = 'POST';
        options.url = `${API_URL}/repos/${data.json.full_name}/releases`;
        options.json = {
            'tag_name': newRelease.tag,
            'target_commitish': data.json.default_branch,
            'name': newRelease.name,
            'body': data.description,
            'draft': false,
            'prerelease': false,
            'generate_release_notes': false
        };
        request(options, (error, response, body) => {
            if (error || response.statusCode !== 201) return console.log(`Creating ${newRelease.name} for ${data.json.full_name} is failed`)

            console.log(`${newRelease.name} for ${data.json.full_name} is created`);
        });
        options.method = 'GET';
    });
});
