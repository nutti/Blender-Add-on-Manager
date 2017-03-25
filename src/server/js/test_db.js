'use strict';

import BlAddonDB from 'bl_add-on_db';
const db = new BlAddonDB();

import DBWriter from 'db_writer';
const writer = new DBWriter();

import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.resolve('./config.json');

let text = fs.readFileSync(CONFIG_FILE, 'utf8');
console.log("Parsing configuration file ...");
let config = JSON.parse(text);
console.log("Parsed configuration file ...");

writer.init();

db.init(config, 1, 1, 0, 499);
db.buildAddonDB( () => {
    db.writeDB(writer);
    console.log("fin");
});

loop();

function loop() {
    console.log("loop");
    setTimeout(() => { loop() }, 10000);
}
