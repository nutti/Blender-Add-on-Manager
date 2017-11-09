'use strict';

import os from 'os';
import fs from 'fs';

import * as Utils from 'utils';
import * as Blam from 'blam';
import Logger from 'logger';
const logger = new Logger();


export default class BlamLocal
{
    /* customDir: BlamCustomDir */
    constructor(customDir, blamOS) {
        this['addonList'] = {
            'default': [],
            'custom': []
        };

        if (customDir) { this['blamCustomDir'] = customDir; }
        if (blamOS) { this['blamOS'] = blamOS; }
    }

    // get installed add-on name
    _getInstalledAddonName() {
        let defaultAddonList = {};
        let customAddonList = {};
        let osType = this['blamOS'].getOSType();
        let loginUser = this['blamOS'].getLoginUser();
        let blVers = this['blamOS'].getBlenderVersions();

        for (let i = 0; i < blVers.length; ++i) {
            let version = blVers[i];
            defaultAddonList[version] = [];

            let scriptPath = this['blamOS']._makeAddonPath(osType, loginUser, version);
            if (!scriptPath) { throw new Error("Failed to get script path"); }
            if (!Utils.isDirectory(scriptPath)) { continue; }

            let list = fs.readdirSync(scriptPath);
            list = list.filter( (e) => {
                return e != "__pycache__";
            });
            if (list.length == 0) { continue; }

            for (let l = 0; l < list.length; ++l) {
                defaultAddonList[version].push({'name': list[l]});
            }
        }


        // custom install directory
        if (this['blamCustomDir']) {
            let customDir = this['blamCustomDir'].getTarget();

            if (customDir && Utils.isDirectory(customDir)) {
                let list = fs.readdirSync(customDir);
                list = list.filter( (e) => {
                    return e != "__pycache__";
                });

                customAddonList[customDir] = [];
                for (let l = 0; l < list.length; ++l) {
                    customAddonList[customDir].push({'name': list[l]});
                }
            }

        }

        this['addonList']['default'] = defaultAddonList;
        this['addonList']['custom'] = customAddonList;
    }

    _buildBlInfo(addonPath, addonDir) {
        let separator = this['blamOS'].getPathSeparator();

        for (let i in addonDir) {
            let path = addonPath + separator + addonDir[i]['name'];
            let mainSrcPath = path;

            if (Utils.isDirectory(mainSrcPath)) {
                let list = fs.readdirSync(mainSrcPath);
                let found = false;

                for (let i = 0; i < list.length; ++i) {
                    if (list[i].indexOf("__init__.py") >= 0) {
                        mainSrcPath += separator + "__init__.py";
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

            let blInfoBody = Blam.extractBlInfoBody(srcBody);
            if (!blInfoBody) { continue; }      // ignore

            let info = Blam.parseBlInfo(blInfoBody);
            if (!info) { continue; }            // ignore

            addonDir[i]['bl_info'] = Blam.validateBlInfo(info);
            addonDir[i]['main_src_path'] = mainSrcPath;
            addonDir[i]['src_path'] = path;

            // cleanup
            delete addonDir[i]['name'];
        }
        // cleanup
        addonDir = addonDir.filter( (elm) => {
            return elm['bl_info'] != undefined;
        });

        return addonDir;
    }

    // get bl_info
    _getBlInfo() {
        let defaultDirList = this['addonList']['default'];
        let customDirList = this['addonList']['custom'];
        let osType = this['blamOS'].getOSType();
        let loginUser = this['blamOS'].getLoginUser();

        for (let key in defaultDirList) {
            let addonPath = this['blamOS']._makeAddonPath(osType, loginUser, key);
            if (!addonPath) { throw new Error("Failed to get add-on path"); }
            defaultDirList[key] = this._buildBlInfo(addonPath, defaultDirList[key]);
        }

        for (let key in customDirList) {
            customDirList[key] = this._buildBlInfo(key, customDirList[key]);
        }


        this['addonList']['default'] = defaultDirList;
        this['addonList']['custom'] = customDirList;
    }

    // check installed blender add-on
    update() {
        this._getInstalledAddonName();
        this._getBlInfo();
    }

    loadFrom(file) {
        if (!Utils.isExistFile(file)) { throw new Error('Not found DB file...'); }

        let data = fs.readFileSync(file, 'utf8');
        let json = JSON.parse(data);

        this['addonList'] = json || [];
    }

    saveTo(file) {
        fs.writeFileSync(file, JSON.stringify(this['addonList'], null, '  '));
    }

    getAddonList() {
        return this['addonList'];
    }
}
