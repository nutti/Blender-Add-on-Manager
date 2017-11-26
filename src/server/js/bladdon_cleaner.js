'use strict';


import fs from 'fs';
import request from 'request';

import DBWriter from 'blam-db-writer';
const dbWriter = new DBWriter();
import BlamDB from 'blam-db';
const blamDB = new BlamDB();

const CONFIG_FILE = process.cwd() + '/config.json';

let config;

function isLinkDown(url, proxyURL) {
    return new Promise(function (resolve) {
        if (proxyURL) {
            request({
                    tunnel: true,
                    url: url,
                    json: true,
                    proxy: proxyURL
                }, (err, res, body) => {
                    if (res.statusCode === 404) {
                        resolve(true);
                    }
                    resolve(false);
                }
            );
        }
        else {
            request({
                    url: url,
                    json: true,
                }, (err, res, body) => {
                    if (res.statusCode === 404) {
                        resolve(true);
                    }
                    resolve(false);
                }
            );
        }
    });
}


let text;

text = fs.readFileSync(CONFIG_FILE, 'utf8');
console.log("Parsing configuration file ...");
config = JSON.parse(text);
console.log("Parsed configuration file.");

// cleanup link downed addons
async function cleanupAddons(start, end) {
    console.log("Start cleanup ...");
    console.log("Initializing DBWriter ...");

    await dbWriter.init();

    let all = await dbWriter.countAll();
    if (all < end) {
        end = all;
    }
    let total = end - start + 1;
    let addonList = await dbWriter.findAll();

    let remain = total;

    let deleted = 0;
    let clean = 0;
    let target = 0;
    let i = 0;

    console.log("Finding all DB records ...");

    for (let addon = await addonList.next(); addon != null; addon = await addonList.next()) {
        let name = addon['bl_info']['name'];
        let key = addon['key'];

        // skip until start comes
        ++i;
        if (i < start) { continue; }

        // all addons are checked
        if (remain == 0) { break; }

        console.log("[" + (target+1) + "/" + total + "] Checking '" + name + "' ...");
        --remain;
        ++target;

        // remove excluded add-ons
        console.log("  Check: Excluded add-ons");
        let srcDir = addon['src_dir'];
        // release add-on
        if (srcDir.match(/release\/scripts\/addons/)) {
            console.log("    '" + name + "' is release add-on. Trying to delete from DB ...");
            let ret = await dbWriter.remove({'key': key});
            ++deleted;
            continue;
        }
        // contrib add-on
        else if (srcDir.match(/scripts\/addons_contrib/) || srcDir.match(/script\/addons_contrib/)) {
            console.log("    '" + name + "' is contrib add-on. Trying to delete from DB ...");
            let ret = await dbWriter.remove({'key': key});
            ++deleted;
            continue;
        }
        // extern add-on (meta-androcto's add-on database)
        else if (srcDir.match(/scripts\/addons_extern/)) {
            console.log("    '" + name + "' is meta-androcto's add-on database. Trying to delete from DB ...");
            let ret = await dbWriter.remove({'key': key});
            ++deleted;
            continue;
        }
        // test add-on (Nutti's test or sample add-on)
        else if (srcDir.match(/mirror-introduction/)
                 || srcDir.match(/Testing_Blender_Addon_By_Travis_CI/)
                 || srcDir.match(/Testing_Blender_Addon_With_Travis_CI/)
                 || srcDir.match(/gitbook-test/)) {
            console.log(    "'" + name + "' is Nutti's test or sample add-on. Trying to delete from DB ...");
            let ret = await dbWriter.remove({'key': key});
            ++deleted;
            continue;
        }

        // check if repository URL is linked down
        console.log("  Check: Repository URL link");
        let repoURL = addon['url'];
        let isDown = await isLinkDown(repoURL);
        if (isDown) {
            console.log("    '" + name + "' (Repository URL: " + repoURL + ") is link down. Trying to delete from DB ...");
            let ret = await dbWriter.remove({'key': key});
            ++deleted;
            continue;
        }

        // check if source URL is linked down
        console.log("  Check: Source URL link");
        let srcURL = addon['src_url'];
        isDown = await isLinkDown(srcURL);
        if (isDown) {
            console.log("    '" + name + "' (Source URL: " + srcURL + ") is link down. Trying to delete from DB ...");
            let ret = await dbWriter.remove({'key': key});
            ++deleted;
            continue;
        }

        // check if bl_info is correct
        console.log("  Check: Source Raw URL link");
        let srcRawURL = addon['src_raw_url'];
        isDown = await isLinkDown(srcRawURL);
        if (isDown) {
            console.log("    '" + name + "' (Source Raw URL: " + srcRawURL + ") is link down. Trying to delete from DB ...");
            let ret = await dbWriter.remove({'key': key});
            ++deleted;
            continue;
        }
        console.log("  Check: bl_info");
        let valid = await blamDB.isBlInfoValid(srcRawURL);
        if (!valid) {
            console.log("    '" + name + "' has an invalid bl_info. Trying to delete from DB ...");
            let ret = await dbWriter.remove({'key': key});
            ++deleted;
            continue;
        }

        ++clean;
    }

    console.log("Finished cleanup (total: " + total + ", target: " + target + ", clean: " + clean + ", deleted: " + deleted + ")");

    dbWriter.close();
}

let start = parseInt(process.argv[2], 10) || 1;
let numProc = parseInt(process.argv[3], 10) || 10000;
let end = start + numProc - 1;

console.log("Cleanup target '" + start + "-" + end + "'");

cleanupAddons(start, end);
