'use strict';

import fs from 'fs';

import * as Utils from 'utils';
import Logger from 'logger';
const logger = new Logger();

export default class BlamCustomDir
{
    constructor() {
        this['customDirList'] = [];
        this['currentTarget'] = "";
    }

    addItem(item) {
        let index = this['customDirList'].indexOf(item);
        if (index != -1) { return false; }

        this['customDirList'].push(item);
    }

    ignored(item) {
        let index = this['customDirList'].indexOf(item);
        if (index == -1) { return false; }

        return true;
    }

    removeItem(item) {
        let index = this['customDirList'].indexOf(item);
        if (index == -1) { return false; }

        this['customDirList'].splice(index, 1);

        return true;
    }

    getList() {
        return this['customDirList'];
    }

    setTarget(item) {
        let index = this['customDirList'].indexOf(item);
        if (index == -1) { return false; }

        this['currentTarget'] = item;
    }

    getTarget() {
        let index = this['customDirList'].indexOf(this['currentTarget']);
        if (index == -1) { return null; }

        return this['currentTarget'];
    }

    loadFrom(file) {
        if (!Utils.isExistFile(file)) { return 1; }

        let data = fs.readFileSync(file, 'utf8');
        let json = JSON.parse(data);
        this['customDirList'] = json['customDirList'] || [];
        this['currentTarget'] = json['currentTarget'] || "";
        
        return 0;
    }

    saveTo(file) {
        fs.writeFileSync(file, JSON.stringify(
            {
                'customDirList': this['customDirList'],
                'currentTarget': this['currentTarget'],
            },
            null,
            '  '
        ));
    }
}
