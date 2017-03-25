'use strict';

import os from 'os';
import fs from 'fs';
import path from 'path';

import * as Utils from 'utils';
import * as BlAddon from 'bl-addon';
import Logger from 'logger';
const logger = new Logger();


export default class BlAddonChecker
{
    constructor() {
        this['addonList'] = {};
        this['osInfo'] = {};
        this['blVers'] = [];
        this['loginUser'] = "";
        this['pathSeparator'] = "/";
    }

    // get OS information
    getOSInfo() {
        this['osInfo'] = {};
        this['pathSeparator'] = "/";
        logger.category('lib').info("Check Operating System Type ...");
        this['osInfo']['type'] = os.type().toString();
        this['osInfo']['release'] = os.release().toString();
        this['osInfo']['platform'] = os.platform().toString();
        logger.category('lib').info("===Operating System Infomation===");
        logger.category('lib').info(this['osInfo']);
        logger.category('lib').info("=================================");

        switch (this['osInfo']['type']) {
            case 'Windows_NT':
                this['pathSeparator'] = "\\";
            case 'Linux':
            case 'Darwin':
                this['pathSeparator'] = "/";
        }
    }

    // check blender version in user config directory
    checkBlVer() {
        let fn = {};

        this['loginUser'] = "";
        this.blVers = [];

        fn['Windows_NT'] = (self_) => {
            let blUserPath;
            self_.loginUser = process.env['USERPROFILE'].split(path.sep)[2];
            blUserPath = "C:\\Users\\"
                + self_.loginUser
                + "\\AppData\\Roaming\\Blender Foundation\\Blender";
            if (!Utils.isDirectory(blUserPath)) { return; }
            self_.blVers = fs.readdirSync(blUserPath);
            self_.blVers = self_.blVers.filter( (dir) => {
                let isDir = Utils.isDirectory(blUserPath + '\\'+ dir);
                let isVersionDir = /[0-9]\.[0-9]{2}$/.test(dir);
                return isDir && isVersionDir;
            });
        };

        fn['Linux'] = (self_) => {
            let blUserPath;
            self_.loginUser = process.env['USER'];
            blUserPath = "/home/"
                + self_.loginUser
                + "/.config/blender";
            if (!Utils.isDirectory(blUserPath)) { return; }
            self_.blVers = fs.readdirSync(blUserPath);
            self_.blVers = self_.blVers.filter( (dir) => {
                let isDir = Utils.isDirectory(blUserPath + "/" + dir);
                let isVersionDir = /[0-9]\.[0-9]{2}$/.test(dir);
                return isDir && isVersionDir;
            });
        };

        fn['Darwin'] = (self_) => {
            let blUserPath;
            self_.loginUser = process.env['USER'];
            blUserPath = "/Users/"
                + self_.loginUser
                + "/Library/Application Support/Blender";
            if (!Utils.isDirectory(blUserPath)) { return; }
            self_.blVers = fs.readdirSync(blUserPath);
            self_.blVers = self_.blVers.filter( (dir) => {
                let isDir = Utils.isDirectory(blUserPath + "/" + dir);
                let isVersionDir = /[0-9]\.[0-9]{2}$/.test(dir);
                return isDir && isVersionDir;
            });
        };


        if (fn[this['osInfo']['type']]) {
            fn[this['osInfo']['type']](this);
        }
        else {
            throw new Error("Unknown operating system");
        }
    }

    // make add-on path from OS type, username, blender version
    makeAddonPath(osType, user, blVer) {
        var scriptPath = this.makeScriptPath(osType, user, blVer);
        if (!scriptPath) {
            return null;
        }

        return scriptPath + this['pathSeparator'] + "addons";
    }

    // make script path from OS type, username, blender version
    makeScriptPath(osType, user, blVer) {
        switch (osType) {
            case 'Windows_NT':
                return "C:\\Users\\" + user + "\\AppData\\Roaming\\Blender Foundation\\Blender\\" + blVer + "\\scripts";
            case 'Linux':
                return "/home/" + user + "/.config/blender/" + blVer + "/scripts";
            case 'Darwin':
                return "/Users/" + user + "/Library/Application Support/Blender/" + blVer + "/scripts";
        }

        return null;
    }

    // get installed add-on name
    getInstalledAddonName() {
        this['addonList'] = {};

        for (let i = 0; i < this.blVers.length; ++i) {
            let version = this.blVers[i];
            let scriptPath = this.makeAddonPath(this['osInfo']['type'], this['loginUser'], version);
            if (!scriptPath) { throw new Error("Failed to get script path"); }
            if (!Utils.isDirectory(scriptPath)) { continue; }
            let list = fs.readdirSync(scriptPath);
            list = list.filter( (e) => {
                return e != "__pycache__";
            });
            if (list.length == 0) { continue; }
            this['addonList'][version] = [];
            for (let l = 0; l < list.length; ++l) {
                this['addonList'][version].push({'name': list[l]});
            }
        }
    }

    // get bl_info
    getBlInfo() {
        for (let key in this['addonList']) {
            let addonPath = this.makeAddonPath(this['osInfo']['type'], this['loginUser'], key);
            if (!addonPath) { throw new Error("Failed to get add-on path"); }
            for (let i in this['addonList'][key]) {
                let path = addonPath + this['pathSeparator'] + this['addonList'][key][i]['name'];
                let mainSrcPath = path;
                if (Utils.isDirectory(mainSrcPath)) {
                    let list = fs.readdirSync(mainSrcPath);
                    let found = false;
                    for (let i = 0; i < list.length; ++i) {
                        if (list[i].indexOf("__init__.py") >= 0) {
                            mainSrcPath += this['pathSeparator'] + "__init__.py";
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        continue;   // skip if __init__.py is not found
                    }
                }
                let srcBody = fs.readFileSync(mainSrcPath).toString();
                if (!Utils.isExistFile(mainSrcPath)) { throw new Error("File '" + mainSrcPath + "' does not exist"); }
                let blInfoBody = Utils.extractBlInfoBody(srcBody);
                if (!blInfoBody) { continue; }      // ignore
                let info = Utils.parseBlInfo(blInfoBody);
                if (!info) { continue; }            // ignore
                this['addonList'][key][i]['bl_info'] = BlAddon.validateBlInfo(info);
                this['addonList'][key][i]['main_src_path'] = mainSrcPath;
                this['addonList'][key][i]['src_path'] = path;

                // cleanup
                delete this['addonList'][key][i]['name'];
            }
            // cleanup
            this['addonList'][key] = this['addonList'][key].filter( (elm) => {
                return elm['bl_info'] != undefined;
            });
        }
    }

    // get blender version which is installed on machine
    getInstalledBlVers() {
        this.getOSInfo();
        this.checkBlVer();

        return this.blVers;
    }

    // check installed blender add-on
    checkInstalledBlAddon() {
        this.getOSInfo();
        this.checkBlVer();
        this.getInstalledAddonName();
        this.getBlInfo();
    }

    getAddonPath(blVer) {
        this.getOSInfo();
        this.checkBlVer();

        let scriptPath = this.makeAddonPath(this['osInfo']['type'], this['loginUser'], blVer);
        if (!scriptPath) { return null; }
        if (!Utils.isDirectory(scriptPath)) { return null; }

        return scriptPath;
    }

    createAddonDir(blVer) {
        this.getOSInfo();
        this.checkBlVer();

        let scriptPath = this.makeScriptPath(this['osInfo']['type'], this['loginUser'], blVer);
        let addonPath = this.makeAddonPath(this['osInfo']['type'], this['loginUser'], blVer);
        if (!scriptPath) { throw new Error("Failed to create " + scriptPath); }
        if (!Utils.isDirectory(scriptPath)) {
            if (Utils.isExistFile(scriptPath)) { throw new Error(scriptPath + " is already exist"); }
            fs.mkdirSync(scriptPath);
        }
        if (!Utils.isDirectory(addonPath)) {
            if (Utils.isExistFile(addonPath)) { throw new Error(addonPath + " is already exist"); }
            fs.mkdirSync(addonPath);
        }
    }

    getPathSeparator() {
        return this['pathSeparator'];
    }

    saveTo(file) {
        fs.writeFileSync(file, JSON.stringify(this['addonList'], null, '  '));
    }
}
