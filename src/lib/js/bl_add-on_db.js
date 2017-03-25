'use strict';

// external modules
import fs from 'fs';
import client from 'cheerio-httpcli';
import https from 'https';
import request from 'request';

// own modules
import * as Utils from 'utils';
import * as BlAddon from 'bl-addon';
import Logger from 'logger';
const logger = new Logger();

const GITHUB_URL = 'https://github.com';

export default class BlAddonDB
{
    constructor() {
        this['config'] = null;
        this['addonDB'] = {};
        this['startPage'] = 0;
        this['endPage'] = 1;
        this['minFileSize'] = 0;
        this['maxFileSize'] = 1000;
        this['db'] = null;
    }

    // initialize
    init(config, startPage, endPage, minFileSize, maxFileSize) {
        if (config) { this['config'] = config; }
        if (startPage) { this['startPage'] = startPage; }
        if (endPage) { this['endPage'] = endPage; }
        if (minFileSize) { this['minFileSize'] = minFileSize; }
        if (maxFileSize) { this['maxFileSize'] = maxFileSize; }
        this['addonDB'] = {};
        this['db'] = null;
    }

    setPages(startPage, endPage) {
        if (startPage) { this['startPage'] = startPage; }
        if (endPage) { this['endPage'] = endPage; }
    }

    setFileSizes(minFileSize, maxFileSize) {
        if (minFileSize) { this['minFileSize'] = minFileSize; }
        if (maxFileSize) { this['maxFileSize'] = maxFileSize; }
    }

    fini() {
    }

    // login to GitHub
    _loginGitHub(result) {
        let self_ = this;
        return new Promise( (resolve, reject) => {
            // check login information
            if (!self_._isGitHubConfigValid(self_.config)) { throw new Error("Invalid GitHub configuration"); }
            let loginInfo = {
                login: self_.config.github.username,
                password: self_.config.github.password
            };

            // login to GitHub
            logger.category('lib').info("Login to GitHub as " + loginInfo.login + " ...");
            result.$('form').submit(loginInfo, (err, $, res, body) => {
                if (err) { throw new Error("Failed to login to GitHub"); }
                logger.category('lib').info("Login successfully.");
                resolve();
            });
        });
    }

    _getRepoURL(page) {
        var self_ = this;
        var repoURLs = [];
        return new Promise( (resolve) => {
            // fetch search result
            var query = 'bl_info+blender+size:' + self_['minFileSize'] + '..' + self_['maxFileSize'];
            client.fetch(
                'https://github.com/search',
                {
                    q: query,
                    type: 'Code',
                    ref: 'searchresults',
                    p: page
                },
                (err, $, res) => {
                    if (err) { throw new Error("Failed to fetch (query=" + query + ", page=" + page + ")") }
                    $('a').each( function(idx)  {
                        var link = $(this).attr('href');
                        // only .py is allowed
                        if (link.slice(-3) == ".py") {
                            repoURLs.push(link);
                        }
                    });
                    resolve(repoURLs);
                }
            );
        });
    }

    // build repository's information
    _buildRepoInfo(repoURLs) {
        let infoList = [];
        for (let i = 0; i < repoURLs.length; ++i) {
            let info = {};
            let repoURL = repoURLs[i];
            info["url"] = GITHUB_URL + repoURL.slice(0, repoURL.indexOf('/blob/'));
            info["src_main"] = repoURL.slice(repoURL.lastIndexOf('/') + 1);
            info["src_url"] = GITHUB_URL + repoURL;
            info["src_raw_url"] = info["src_url"].replace("github.com", "raw.githubusercontent.com").replace("blob/", "");
            info["download_url"] = info["url"] + "/archive/master.zip";
            let matched = repoURL.match(/\/blob\/[a-zA-z0-9]+\//);
            if (!matched) { throw new Error("Does not match blob"); }
            let idx = matched['index'];
            info["src_dir"] = repoURL.slice(idx + matched[0].length - 1, repoURL.lastIndexOf('/'));
            info['repo_name'] = info['url'].slice(info['url'].lastIndexOf('/') + 1);
            infoList.push(info);
        }

        return infoList;
    }

    _getMainSrc(url) {
        let self_ = this;
        return new Promise( (resolve) => {
            function onRequest(err, response, body) {
                let srcBody = null;
                if (err) {
                    logger.category('lib').warn("Failed to fetch data from API (err=" + JSON.stringify(err) + ", url=" + url + ")" );
                }
                else if (response.statusCode != 200) {
                    logger.category('lib').warn("Failed to fetch data from API. (status=" + response.statusCode + ")");
                }
                else {
                    srcBody = body;
                }
                resolve(srcBody);
            }
            let proxyURL = Utils.getProxyURL(self_.config);
            if (proxyURL) {
                request({
                    tunnel: true,
                    url: url,
                    proxy: proxyURL
                }, onRequest);
            }
            else{
                request({ url: url }, onRequest);
            }
        });
    }

    // parse add-on's main source
    _parseMainSrc(srcBody) {
        if (!srcBody) { return null; }

        var blInfoBody = Utils.extractBlInfoBody(srcBody);
        if (!blInfoBody) { return null; }

        var info = Utils.parseBlInfo(blInfoBody);
        if (!info) { return null; }

        return BlAddon.validateBlInfo(info);
    }

    async buildAddonDB(cb) {
        var self_ = this;
        let fetched = await client.fetch('https://github.com/login');
        let login = await self_._loginGitHub(fetched);

        // build repo's info
        let repoURLs = [];
        for (let p = self_['startPage']; p <= self_['endPage']; ++p) {
            let urls = await self_._getRepoURL(p, repoURLs);
            Array.prototype.push.apply(repoURLs, urls);
        }
        let repoInfos = self_._buildRepoInfo(repoURLs);

        // get bl_info
        for (let i = 0; i < repoInfos.length; ++i) {
            let srcBody = await self_._getMainSrc(repoInfos[i]["src_raw_url"]);
            if (!srcBody) { continue; }
            repoInfos[i]['main_src_body'] = srcBody;
            let info = self_._parseMainSrc(srcBody);
            if (!info) { continue; }
            repoInfos[i]['bl_info'] = info;
        }

        // cleanup
        repoInfos = repoInfos.filter( (elm) => {
            return elm['bl_info'] != undefined;
        });
        for (var i = 0; i < repoInfos.length; ++i) {
            delete repoInfos[i]['main_src_body'];
        }

        this['addonDB'] = repoInfos;

        cb();
    }

    // check if GitHub config is valid
    _isGitHubConfigValid(config) {
        if (!config) { return false; }
        if (!config.github) { return false; }
        if (!config.github.username) { return false; }
        if (!config.github.password) { return false; }

        return true;
    }

    writeDBFile(filename, overwrite) {
        if (!this['db']) {
            throw new Error("Database is not built");
        }

        if (Utils.isExistFile(filename)) {
            if (overwrite) {
                fs.unlink(filename, (err) => {
                    logger.category('lib').info("Removed old add-on database file");
                });
            }
            else {
                throw new Error(filename + "is already exists");
            }
        }

        fs.appendFile(filename, JSON.stringify(repoInfoList, null, '  '));
    }

    async writeDB(db) {
        let dbWriter = db;
        if (!dbWriter) { throw new Error("DB is not registered"); }
        if (!dbWriter.connected()) {
            throw new Error("DB Writer is not connected. Data will be lost");
            return;
        }

        let repoInfoList = this['addonDB'];

        // remove improper add-ons
        repoInfoList = repoInfoList.filter( (elm) => {
            // remove addons: release add-on should be removed
            let isAddonRelease = elm['src_dir'].match(/release\/scripts\/addons/);
            // remove addon_contrib: this is very large file
            let isAddonContrib = elm['src_dir'].match(/script\/addons_contrib/);
            // remove addon_extern: includes meta-androcto's add-on database. this is also very large file
            let isAddonExtern = elm['src_dir'].match(/scripts\/addons_extern/);
            // remove test addon: Nutti's test repository about sample add-on
            let isAddonTest = elm['repo_name'].match(/mirror-introduction/)
                || elm['repo_name'].match(/Testing_Blender_Addon_By_Travis_CI/)
                || elm['repo_name'].match(/Testing_Blender_Addon_With_Travis_CI/)
                || elm['repo_name'].match(/gitbook-test/);

            return !isAddonRelease && !isAddonContrib && !isAddonExtern && !isAddonTest;
        });

        // generate key for database
        repoInfoList.forEach( (elm) => {
            let name = elm['bl_info']['name'];
            let author = elm['bl_info']['author'];
            let key = Utils.genBlAddonKey(name, author);
            elm['key'] = key
        });

        // remove duplicate
        let tmpList = {};
        for (let i = 0; i < repoInfoList.length; ++i) {
            let elm = repoInfoList[i];
            let key = elm['key'];
            if (!tmpList[key]) {
                tmpList[key] = [];
            }
            tmpList[key].push(elm);
        }
        let noDupli = [];
        for (let key in tmpList) {
            let elms = tmpList[key];
            let newest = elms[0];
            for (let i = 1; i < elms.length; ++i) {
                let ver1 = newest['bl_info']['version'];
                let ver2 = elms[i]['bl_info']['version'];
                if (BlAddon.compareAddonVersion(ver1, ver2) == -1) { // ver1 < ver2
                    newest = elms[i];
                }
            }
            noDupli.push(newest);
        }

        // write to database
        for (let i = 0; i < noDupli.length; ++i) {
            let elm = noDupli[i];
            let key = {'key': elm['key']};
            try {
                let result = await dbWriter.findOne(key);
                // find
                if (result) {
                    let ver1 = result['bl_info']['version'];
                    let ver2 = elm['bl_info']['version'];
                    if (BlAddon.compareAddonVersion(ver1, ver2) >= 0) {    // ver1 >= ver2
                        logger.category('lib').info("No need to updated (key=" + elm['key'] + ")");
                        continue;
                    }
                    let record = await dbWriter.update({'key': elm['key']}, elm);
                    logger.category('lib').info("Updated (key=" + elm['key'] + ")");
                }
                // not found
                else {
                    let record = await dbWriter.add(elm);
                    logger.category('lib').info("Added (key=" + elm['key'] + ")");
                }
            }
            catch (e) {
                console.log(e);
            }
        } // for

    }

    // read local DB file and return data formatted in JSON
    readDBFile(file) {
        if (!Utils.isExistFile(file)) { throw new Error('Not found DB file...'); }

        logger.category('lib').info("Reading DB file...");

        let data = fs.readFileSync(file, 'utf8');
        let json = JSON.parse(data);

        return json;
    }

    // make API status file
    makeAPIStatusFile(filename) {
        let self_ = this;
        return new Promise( (resolve) => {
            let apiURLs = Utils.getAPIURL(self_.config);
            if (!apiURLs) { throw new Error("Invalid API URL"); }
            // if there is DB file on local, delete it
            if (Utils.isExistFile(filename)) {
                fs.unlinkSync(filename);
                logger.category('lib').info("Removed old API status file");
            }
            // request callback
            let onRequest = (err, res, body) => {
                if (err) { throw new Error("Failed to fetch data from API.\n" + JSON.stringify(err)); }
                if (res.statusCode != 200) { throw new Error("Failed to fetch data from API. (status=" + res.statusCode + ")"); }

                fs.appendFileSync(filename, JSON.stringify(body, null, '  '));
                logger.category('lib').info("API status data is saved to " + filename);
                resolve();
            };

            // send request to api server
            let proxyURL = Utils.getProxyURL(self_.config);
            if (proxyURL) {
                logger.category('lib').info("Use proxy server");
                request({
                    tunnel: true,
                    url: apiURLs['version'],
                    json: true,
                    proxy: proxyURL
                }, onRequest);
            }
            else {
                logger.category('lib').info("Not use proxy server");
                request({
                    url: apiURLs['version'],
                    json: true,
                }, onRequest);
            }
        });
    }

    // fetch add-on information from server, and save to local DB file
    fetchFromDBServer(filename) {
        let self_ = this;
        return new Promise( (resolve) => {
            let apiURLs = Utils.getAPIURL(self_.config);
            if (!apiURLs) { throw new Error("Invalid API URL"); }
            // if there is DB file on local, delete it
            if (Utils.isExistFile(filename)) {
                fs.unlinkSync(filename);
                logger.category('lib').info("Removed old add-on database file");
            }

            // request callback
            let onRequest = (err, res, body) => {
                if (err) { throw new Error("Failed to fetch data from API.\n" + JSON.stringify(err)); }
                if (res.statusCode != 200) { throw new Error("Failed to fetch data from API. (status=" + res.statusCode + ")"); }

                fs.appendFileSync(filename, JSON.stringify(body, null, '  '));
                logger.category('lib').info("Fetched data is saved to " + filename);
                resolve();
            };

            // send request to api server
            let proxyURL = Utils.getProxyURL(self_.config);
            if (proxyURL) {
                logger.category('lib').info("Use proxy server");
                request({
                    tunnel: true,
                    url: apiURLs['list_github'],
                    json: true,
                    proxy: proxyURL
                }, onRequest);
            }
            else {
                logger.category('lib').info("Not use proxy server");
                request({
                    url: apiURLs['list_github'],
                    json: true,
                }, onRequest);
            }
        });
    }
};
