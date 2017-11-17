'use strict';

import * as Utils from 'utils';
import Logger from 'logger';
const logger = new Logger();
import PyDictParser from 'pydict-parser';
const pyDictParser = new PyDictParser();

import {BL_INFO_UNDEF} from 'blam-constants';


// if there is undefined entry, fake data is used
export function validateBlInfo(info) {
    let out = info;
    let keys = [
        'author', 'blender', 'category', 'description', 'location', 'name', 'support',
        'tracker_url', 'version', 'warning', 'wiki_url'
    ];
    for (let i = 0; i < keys.length; ++i) {
        let k = keys[i];
        out[k] = out[k] || BL_INFO_UNDEF;
        if (Utils.is('Array', out[k])) {
            out[k] = out[k].join(', ');
        }
    }

    return out;
}

export function compareAddonVersion(v1, v2) {
    if (v1 === BL_INFO_UNDEF) {
        if (v2 === BL_INFO_UNDEF) {
            return 0;   // ver1 == ver2
        }
        return -1;   // ver1 < ver2
    }
    if (v2 === BL_INFO_UNDEF) {
        return 1;   // ver1 > ver2
    }

    return compareVersion(v1.split('.'), v2.split('.'));
}

// ver1 > ver2 : 1
// ver1 == ver2 : 0
// ver1 < ver2 : -1
export function compareVersion(v1, v2) {
    let len = v1.length;
    if (len < v2.length) {
        len = v2.length;
    }

    if (v1.length != v2.length) {
        console.log('[INFO] Argument is not same size. (ver1:' + v1 + ', ver2:' + v2 + ')');
    }

    function comp(v1, v2, idx, len) {
        if (v1[idx] === undefined) {
            if (v2[idx] === undefined) {
                return 0;   // v1 == v2
            }
            return -1;  // v1 < v2
        }
        if (v2[idx] === undefined) {
            return 1;   // v1 > v2
        }

        if (len <= idx) {
            console.log('[WARN] Index over');
            return 0;
        }

        if (v1[idx] > v2[idx]) {
            return 1;   // v1 > v2
        }
        else if (v1[idx] < v2[idx]) {
            return -1;  // v1 < v2
        }

        return comp(v1, v2, idx + 1, len);
    }

    return comp(v1, v2, 0, len);
}

export function filterAddons(addons, source, status, target, category, regex, ignore) {
    let keys = Object.keys(addons).filter( (key) => {
        // filtered by ignore list
        for (let i = 0; i < ignore.length; ++i) {
            if (ignore[i] === key) {
                return false;
            }
        }

        // filtered by source
        if (addons[key][source] === undefined) { return false; }

        // filtered by status
        let statusMatched = false;
        for (let i = 0; i < status.length; ++i) {
            if (addons[key]['status'][target] && addons[key]['status'][target] === status[i]) {
                statusMatched = true;
            }
        }

        // filtered by blender version (only installed)
        if (source === 'installed' && addons[key][source][target] === undefined) { return false; }

        let elm;
        if (source === 'installed') {
            elm = addons[key][source][target];
        }
        else {
            elm = addons[key][source];
        }

        // filtered by category
        let categoryMatched = (category.indexOf('All') != -1) || (category.indexOf(elm['bl_info']['category']) != -1);

        // filtered by search string
        let regexp = new RegExp(regex, "i");
        let nameMatched = (elm['bl_info']['name'] != undefined && elm['bl_info']['name'].match(regexp) != null);
        let authorMatched = (elm['bl_info']['author'] != undefined && elm['bl_info']['author'].match(regexp) != null);
        let descMatched = (elm['bl_info']['description'] != undefined && elm['bl_info']['description'].match(regexp) != null);
        let found = nameMatched || authorMatched || descMatched;

        return statusMatched && categoryMatched && found;
    });

    return keys;
}

function _compareAddonsByBlInfoItem(a, b, list, target, item, order)
{
    let an;
    let bn;

    if (list == 'installed') {
        an = a[list][target]['bl_info'][item];
        bn = b[list][target]['bl_info'][item];
    }
    else if (list == 'github') {
        an = a[list]['bl_info'][item];
        bn = b[list]['bl_info'][item];
    }

    if (an > bn) {
        return order == 'ASCEND' ? 1 : -1;
    }
    else if (an < bn) {
        return order == 'ASCEND' ? -1 : 1;
    }

    return 0;
}

function _compareAddons(a, b, list, target, item, order)
{
    switch (item) {
        case 'ADDON_NAME':
            return _compareAddonsByBlInfoItem(a, b, list, target, 'name', order);
            break;
        case 'AUTHOR':
            return _compareAddonsByBlInfoItem(a, b, list, target, 'author', order);
            break;
    }

    return 0;
}

export function sortAddons(addons, keys, list, target, item, order)
{
    if (item == '') { return keys; }

    keys.sort( function (a, b) {
        return _compareAddons(addons[a], addons[b], list, target, item, order);
    });

    return keys;
}

export function updateAddonStatus(github, installed, blVers, favList)
{
    // key--
    //      |- github--
    //      |          |- bl_info
    //      |- installed
    //      |          |- blVer
    //      |                  |- bl_info
    //      |- status
    //      |- favorited
    let addonStatus = {};

    // setup add-on list on GitHub
    if (github) {
        for (let g = 0, len = github.length; g < len; ++g) {
            let githubKey = github[g]['bl_info']['name'] + "@" + github[g]['bl_info']['author'];
            if (addonStatus[githubKey] == undefined) {
                addonStatus[githubKey] = {};
            }
            if (addonStatus[githubKey]['github'] == undefined) {
                addonStatus[githubKey]['github'] = github[g];
            }
            // newest version is registered
            else {
                let ver1 = addonStatus[githubKey]['github']['bl_info']['version'];
                let ver2 = github[g]['bl_info']['version'];
                if (compareAddonVersion(ver1, ver2) == -1) {    // ver1 < ver2
                    addonStatus[githubKey]['github'] = github[g];
                }
            }
        }
    }

    // setup add-on list installed on machine
    if (installed) {
        let defaultInstList = installed['default'];
        for (let blVer in defaultInstList) {
            let dil = defaultInstList[blVer];
            for (let i = 0, len = dil.length; i < len; ++i) {
                let installedKey = dil[i]['bl_info']['name'] + "@" + dil[i]['bl_info']['author'];
                if (addonStatus[installedKey] == undefined) {
                    addonStatus[installedKey] = {};
                }
                if (addonStatus[installedKey]['installed'] == undefined) {
                    addonStatus[installedKey]['installed'] = {}
                }
                if (addonStatus[installedKey]['installed'][blVer] == undefined) {
                    addonStatus[installedKey]['installed'][blVer] = dil[i];
                }
                // newest version is registered
                else {
                    let ver1 = addonStatus[installedKey]['installed'][blVer]['bl_info']['version'];
                    let ver2 = dil[i]['bl_info']['version'];
                    if (compareAddonVersion(ver1, ver2) == -1) {    // ver1 < ver2
                        addonStatus[installedKey]['installed'][blVer] = dil[i];
                    }
                }
            }
        }
        let customInstList = installed['custom'];
        for (let dir in customInstList) {
            let cil = customInstList[dir];
            for (let i = 0, len = cil.length; i < len; ++i) {
                let installedKey = cil[i]['bl_info']['name'] + "@" + cil[i]['bl_info']['author'];
                if (addonStatus[installedKey] == undefined) {
                    addonStatus[installedKey] = {};
                }
                if (addonStatus[installedKey]['installed'] == undefined) {
                    addonStatus[installedKey]['installed'] = {}
                }
                if (addonStatus[installedKey]['installed'][dir] == undefined) {
                    addonStatus[installedKey]['installed'][dir] = cil[i];
                }
                // newest version is registered
                else {
                    let ver1 = addonStatus[installedKey]['installed'][dir]['bl_info']['version'];
                    let ver2 = cil[i]['bl_info']['version'];
                    if (compareAddonVersion(ver1, ver2) == -1) {    // ver1 < ver2
                        addonStatus[installedKey]['installed'][dir] = cil[i];
                    }
                }
            }

        }
    }

    // update current status
    for (let k in addonStatus) {
        let addon = addonStatus[k];
        if (addonStatus[k]['status'] == undefined) {
            addonStatus[k]['status'] = {};
        }

        // check if the add-on is favorited
        addonStatus[k]['favorited'] = false;
        for (let i in favList) {
            let fav = favList[i];
            if (fav == k) {
                addonStatus[k]['favorited'] = true;
            }
        }

        // check not only installed but also other version
        let instList = Object.keys(installed['default']);
        let customInstList = Object.keys(installed['custom']);
        for (let i = 0; i < customInstList.length; ++i) {
            instList.push(customInstList[i]);
        }
        for (let i = 0; i < instList.length; ++i) {
            let inst = instList[i];
            let status = '';

            if (addon['github'] == undefined) {
                if (addon['installed'] != undefined && addon['installed'][inst] != undefined) {
                    status = 'INSTALLED';
                }
            }
            else {
                if (addon['installed'] == undefined || addon['installed'][inst] == undefined) {
                    status = 'NOT_INSTALLED';
                }
                else {
                    let ver1 = addon['github']['bl_info']['version'];
                    let ver2 = addon['installed'][inst]['bl_info']['version'];
                    if (compareAddonVersion(ver1, ver2) == 1) {
                        status = 'UPDATABLE';   // ver1 > ver2
                    }
                    else {
                        status = 'INSTALLED';
                    }
                }
            }
            addonStatus[k]['status'][inst] = status;
        }
    }

    return addonStatus;
}

export function genBlAddonKey(name, author) {
    return name + '@' + author;
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
