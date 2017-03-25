'use strict';

import MongoDB from 'mongodb';
const mongodb = MongoDB.MongoClient;

const DB_NAME = 'blAddonMgr';
const COLLECTION_NAME = 'blAddonGitHub';
const DB_HOSTNAME = 'localhost';
const DB_PORT = 27017;

export default class DBWriter
{
    constructor() {
        this['db'] = null;
        this['collection'] = null;
    }

    init() {
        return new Promise( (resolve) => {
            let uri = 'mongodb://' + DB_HOSTNAME + ":" + DB_PORT + "/" + DB_NAME;
            console.log("Connecting to DB Server " + uri + " ...");
            let self_ = this;
            mongodb.connect(uri, function (err, db) {
                if (err) {
                    throw new Error("Failed to connect DB Server " + url);
                }
                self_['db'] = db;
                self_['collection'] = db.collection(COLLECTION_NAME);
                resolve();
            });
        });
    }

    connected() {
        return this['db'] ? true : false;
    }

    close() {
        if (!this['db']) { throw new Error("DB does not open"); }
        this['db'].close();
    }

    add(info) {
        return new Promise( (resolve) => {
            if (!this['collection']) { throw new Error("Collection is null"); }

            this['collection'].insert(info, function (err, record) {
                if (err) { throw new Error("Failed to add (data=" + info + ")"); }
                console.log("Suceeded insert.");
                resolve(record);
            });
        });
    }

    update(key, data) {
        return new Promise( (resolve) =>  {
            if (!this['collection']) { throw new Error("Collection is null"); }

            this['collection'].update(key, {$set: data}, function (err) {
                if (err) { throw new Error("Failed to update (key=" + key + ", err=" + err + ")"); }
                resolve();
            });
        });
    }

    find(key) {
        return new Promise( (resolve) => {
            if (!this['collection']) { throw new Error("Collection is null"); }

            this['collection'].find(key, (err, result) => {
                if (err) {
                    throw new Error("Failed to process findOne");
                }
                resolve();
            });
        });
    }

    findOne(key) {
        return new Promise ( (resolve) => {
            if (!this['collection']) { throw new Error("Collection is null"); }

            this['collection'].findOne(key, (err, result) => {
                if (err) {
                    throw new Error("Failed to process findOne");
                }
                resolve(result);
            });
        });
    }
}
