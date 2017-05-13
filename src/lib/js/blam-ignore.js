'use strict';

import fs from 'fs';

import * as Utils from 'utils';
import Logger from 'logger';
const logger = new Logger();

export default class BlamIgnore
{
    constructor() {
        this['ignoreList'] = [];
    }

    addItem(item) {
        let index = this['ignoreList'].indexOf(item);
        if (index != -1) { return false; }

        this['ignoreList'].push(item);
    }

    ignored(item) {
        let index = this['ignoreList'].indexOf(item);
        if (index == -1) { return false; }

        return true;
    }

    removeItem(item) {
        let index = this['ignoreList'].indexOf(item);
        if (index == -1) { return false; }

        this['ignoreList'].splice(index, 1);

        return true;
    }

    getList() {
        return this['ignoreList'];
    }

    loadFrom(file) {
        if (!Utils.isExistFile(file)) { return 1; }

        let data = fs.readFileSync(file, 'utf8');
        this['ignoreList'] = JSON.parse(data);
        
        return 0;
    }

    saveTo(file) {
        fs.writeFileSync(file, JSON.stringify(this['ignoreList'], null, '  '));
    }
}
