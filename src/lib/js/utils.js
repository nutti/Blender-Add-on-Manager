'use strict';

import fs from 'fs';
import request from 'request';
import unzip from 'unzip';

import PyDictParser from 'pydict_parser';
const pyDictParser = new PyDictParser();
import Logger from 'logger';
const logger = new Logger();


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


export function extractBlInfoBody(srcBody) {
    let result = srcBody.match(/\n*(bl_info\s*=\s*)([\s\S]*)$/);
    if (!result || !result[2]) { return null; }
    return result[2];
}

export function parseBlInfo(srcBody) {
    let parsed = null;

    try {
        parsed = pyDictParser.parse(srcBody);
    }
    catch (e) {
        logger.category('lib').warn("==========Parse Error=========");
        logger.category('lib').warn("---srcBody---");
        logger.category('lib').warn(srcBody);
        logger.category('lib').warn("---Exception---");
        logger.category('lib').warn(e);
        return null;
    }
    if (parsed == null) {
        logger.category('lib').warn("Failed to parse source.");
        return null;
    }

    if (parsed['version']) {
       parsed['version'] = parsed['version'].join('.');
    }
    if (parsed['blender']) {
       parsed['blender'] = parsed['blender'].join('.');
    }

    return parsed;
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
            logger.category('lib').info("Not use proxy server");
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
                logger.category('lib').info("Deleting original file ...");
                fs.unlinkSync(from_);
            }
            resolve();
        });
    });
}

export function genBlAddonKey(name, author) {
    return name + '@' + author;
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
            logger.category('lib').info("Not use proxy server");
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
