'use strict';


import fs from 'fs';
import request from 'request';

import DBWriter from 'blam-db-writer';
const dbWriter = new DBWriter();

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
async function cleanupAddons() {
    console.log("Start cleaning up ...");
    console.log("Initializing DBWriter ...");

    await dbWriter.init();
    let addonList = await dbWriter.findAll();

    console.log("Finding all DB records ...");

    for (let addon = await addonList.next(); addon != null; addon = await addonList.next()) {
        let name = addon['bl_info']['name'];
        let url = addon['url'];
        let key = addon['key'];

        console.log("Checking '" + name + "' ...");

        let isDown = await isLinkDown(url);

        if (isDown) {
            console.log("'" + name + "' (" + url + ") is link down. Trying to delete from DB ...");
            let ret = await dbWriter.remove({'key': key});
        }
    }

    console.log("Finished cleaning up.");

    dbWriter.close();
}

cleanupAddons();

