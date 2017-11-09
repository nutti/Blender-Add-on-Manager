'use strict';

import os from 'os';
import fs from 'fs';
import path from 'path';

import * as Utils from 'utils';
import Logger from 'logger';
const logger = new Logger();


export default class BlamOS
{
    constructor() {
        this['osInfo'] = {};
        this['blVers'] = [];
        this['pathSeparator'] = "/";
        this['loginUser'] = null;

        this._getOSInfo();
        this._checkPathSeparator();
        this._checkLoginUser();
        this._checkBlenderVersions();
    }

    // get OS information
    _getOSInfo() {
        let info = {};

        info['type'] = os.type().toString();
        info['release'] = os.release().toString();
        info['platform'] = os.platform().toString();


        this['osInfo'] = info;
    }

    // check path separator
    _checkPathSeparator() {
        switch (this['osInfo']['type']) {
            case 'Windows_NT':
                this['pathSeparator'] = "\\";
                break;
            case 'Linux':
            case 'Darwin':
                this['pathSeparator'] = "/";
                break;
        }
    }

    // check login user
    _checkLoginUser() {
        switch (this['osInfo']['type']) {
            case 'Windows_NT':
                this['loginUser'] = process.env['USERPROFILE'].split(path.sep)[2];
                break;
            case 'Linux':
            case 'Darwin':
                this['loginUser'] = process.env['USER'];
                break;
        }
    }

    // check installed blender version
    _checkBlenderVersions() {
        let fn = {};
        let osType = this['osInfo']['type'];

        fn['Windows_NT'] = (self_) => {
            let blUserPath;
            blUserPath = "C:\\Users\\"
                + self_['loginUser']
                + "\\AppData\\Roaming\\Blender Foundation\\Blender";
            if (!Utils.isDirectory(blUserPath)) { return; }
            self_['blVers'] = fs.readdirSync(blUserPath);
            self_['blVers'] = self_['blVers'].filter( (dir) => {
                let isDir = Utils.isDirectory(blUserPath + '\\'+ dir);
                let isVersionDir = /[0-9]\.[0-9]{2}$/.test(dir);
                return isDir && isVersionDir;
            });
        };

        fn['Linux'] = (self_) => {
            let blUserPath;
            blUserPath = "/home/"
                + self_['loginUser']
                + "/.config/blender";
            if (!Utils.isDirectory(blUserPath)) { return; }
            self_['blVers'] = fs.readdirSync(blUserPath);
            self_['blVers'] = self_['blVers'].filter( (dir) => {
                let isDir = Utils.isDirectory(blUserPath + "/" + dir);
                let isVersionDir = /[0-9]\.[0-9]{2}$/.test(dir);
                return isDir && isVersionDir;
            });
        };

        fn['Darwin'] = (self_) => {
            let blUserPath;
            blUserPath = "/Users/"
                + self_['loginUser']
                + "/Library/Application Support/Blender";
            if (!Utils.isDirectory(blUserPath)) { return; }
            self_['blVers'] = fs.readdirSync(blUserPath);
            self_['blVers'] = self_['blVers'].filter( (dir) => {
                let isDir = Utils.isDirectory(blUserPath + "/" + dir);
                let isVersionDir = /[0-9]\.[0-9]{2}$/.test(dir);
                return isDir && isVersionDir;
            });
        };


        if (fn[osType]) {
            fn[osType](this);
        }
        else {
            throw new Error("Unknown operating system");
        }
    }

    // make add-on path from OS type, username, blender version
    _makeAddonPath(osType, user, blVer) {
        var scriptPath = this._makeScriptPath(osType, user, blVer);
        if (!scriptPath) {
            return null;
        }

        return scriptPath + this['pathSeparator'] + "addons";
    }

    // make script path from OS type, username, blender version
    _makeScriptPath(osType, user, blVer) {
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

    getOSType() {
        return this['osInfo']['type'];
    }
    
    getPathSeparator() {
        return this['pathSeparator'];
    }

    getLoginUser() {
        return this['loginUser'];
    }

    // get blender version which is installed on machine
    getBlenderVersions() {
        return this['blVers'];
    }

    getAddonPath(blVer) {
        let osType = this.getOSType();
        let loginUser = this.getLoginUser();
        let scriptPath = this._makeAddonPath(osType, loginUser, blVer);

        if (!scriptPath) { return null; }
        if (!Utils.isDirectory(scriptPath)) { return null; }

        return scriptPath;
    }

    createAddonDir(blVer) {
        let osType = this.getOSType();
        let loginUser = this.getLoginUser();
        let scriptPath = this._makeScriptPath(osType, loginUser, blVer);
        let addonPath = this._makeAddonPath(osType, loginUser, blVer);

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
}
