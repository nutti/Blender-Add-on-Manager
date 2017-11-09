'use strict';

import os from 'os';
import fs from 'fs';
import path from 'path';
import request from 'request';
import unzip from 'unzip';
import electron from 'electron';


export function getCwd() {
    let type = os.type().toString();
    let cwd = null;

    switch (type) {
        case 'Windows_NT':
        case 'Linux':
            cwd = process.cwd();
            break;
        case 'Darwin':
            cwd = electron.remote.app.getPath('userData');
            break;
    }

    return cwd;
}

export function isExistFile(file) {
    try {
        fs.statSync(file);
        return true;
    }
    catch (err) {
        return false;   // 'ENOENT'
    }
}

export function isDirectory(file) {
    try {
        return fs.statSync(file).isDirectory();
    }
    catch (err) {
        return false;   // 'ENOENT'
    }
}

export function is(type, obj) {
    let t = Object.prototype.toString.call(obj).slice(8, -1);
    return obj !== undefined && obj !== null && t === type;
}



export function isProxyConfigValid(config) {
    if (!config) { return false; }
    if (!config['proxy']) { return false; }
    if (!config['proxy']['username_enc']) { return false; }
    if (!config['proxy']['password']) { return false; }
    if (!config['proxy']['server']) { return false; }
    if (!config['proxy']['port']) { return false; }

    return true;
}

export function getProxyURL(config) {
    if (!isProxyConfigValid(config)) { return null; }
    let url =
        'http://'
        + config['proxy']['username_enc']
        + ":"
        + config['proxy']['password']
        + "@"
        + config['proxy']['server']
        + ":"
        + config['proxy']['port'];

    return url;
}

// check if API config is valid
export function isAPIConfigValid(config) {
    if (!config) { return false; }
    if (!config['db']) { return false; }
    if (!config['db']['server']) { return false; }
    if (!config['db']['port']) { return false; }
    if (!config['db']['api']) { return false; }
    if (!config['db']['endpoint']) { return false; }
    if (!config['db']['endpoint']['addon-list']) { return false; }
    if (!config['db']['endpoint']['version']) { return false; }

    return true;
}

// get API URL
export function getAPIURL(config) {
    if (!isAPIConfigValid(config)) { return null; }
    let base =
        'http://'
        + config['db']['server']
        + ':'
        + config['db']['port']
        + config['db']['api'];

    let apis = {
        'list_github': base + config['db']['endpoint']['addon-list'] + '/github',
        'version': base + config['db']['endpoint']['version'],
    };

    return apis;
}

// check if GitHub config is valid
export function isGitHubConfigValid(config) {
    if (!config) { return false; }
    if (!config['github']) { return false; }
    if (!config['github']['username']) { return false; }
    if (!config['github']['password']) { return false; }

    return true;
}

export function downloadFile(config, url, saveTo) {
    return new Promise( (resolve) => {
        let r;
        // send request to api server
        var proxyURL = getProxyURL(config);
        if (proxyURL) {
            r = request({
                tunnel: true,
                url: url,
                json: true,
                proxy: proxyURL
            });
        }
        else {
            r = request({
                url: url,
                json: true
            });
        }
        let localStream = fs.createWriteStream(saveTo);
        r.on('response', function(response) {
            if (response.statusCode === 200) {
                r.pipe(localStream);
                localStream.on('close', function() {
                    resolve();
                });
            }
            else {
                throw new Error("Failed to download " + url);
            }
        });
    });
}

export function extractZipFile(from_, to, deleteOriginal) {
    return new Promise( (resolve) => {
        let stream = fs.createReadStream(from_).pipe(unzip.Extract({path: to}));
        stream.on('close', () => {
            if (deleteOriginal) {
                fs.unlinkSync(from_);
            }
            resolve();
        });
    });
}

export function getRemoteFileSize(config, url) {
    return new Promise( (resolve) => {
        let r;
        // send request to api server
        var proxyURL = getProxyURL(config);
        if (proxyURL) {
            r = request({
                tunnel: true,
                url: url,
                json: true,
                proxy: proxyURL
            });
        }
        else {
            r = request({
                url: url,
                json: true
            });
        }
        r.on('response', function(response) {
            if (response.statusCode === 200) {
                resolve(response.headers['content-length']);
            }
            else {
                throw new Error("Failed to get file size " + url);
            }
        });
    });
}

