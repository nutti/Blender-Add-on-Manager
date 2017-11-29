'use strict';

import MongoDB from 'mongodb';
const mongodb = MongoDB.MongoClient;

import {DB_NAME, COLLECTION_NAME, DB_HOSTNAME, DB_PORT} from 'blam-constants';

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

    findAll() {
        return new Promise( (resolve) => {
            if (!this['collection']) { throw new Error("Collection is null"); }

            let results = this['collection'].find();

            resolve(results);
        });
    }

    countAll() {
        return new Promise( (resolve) => {
            if (!this['collection']) { throw new Error("Collection is null"); }

            this['collection'].count({}, (err, count) => {
                if (err) {
                    throw new Error("Failed to process countAll");
                }
                resolve(count);
            });
        });
    }

    findOne(key) {
        return new Promise( (resolve) => {
            if (!this['collection']) { throw new Error("Collection is null"); }

            this['collection'].findOne(key, (err, result) => {
                if (err) {
                    throw new Error("Failed to process findOne");
                }
                resolve(result);
            });
        });
    }

    remove(key) {
        return new Promise( (resolve) => {
            if (!this['collection']) { throw new Error("Collection is null"); }

            this['collection'].remove(key, (err, result) => {
                if (err) {
                    throw new Error("Failed to process remove");
                }
                resolve(result);
            });
        });
    }
}
