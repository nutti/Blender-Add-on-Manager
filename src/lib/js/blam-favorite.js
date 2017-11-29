'use strict';

import fs from 'fs';

import * as Utils from 'utils';

export default class BlamFavorite
{
    constructor() {
        this['favList'] = []
    }

    addItem(item) {
        let index = this['favList'].indexOf(item);
        if (index != -1) { return false; }

        this['favList'].push(item);

        return true;
    }

    favorited(item) {
        let index = this['favList'].indexOf(item);
        if (index == -1) { return false; }

        return true;
    }

    removeItem(item) {
        let index = this['favList'].indexOf(item);
        if (index == -1) { return false; }

        this['favList'].splice(index, 1);

        return true;
    }

    getList() {
        return this['favList'];
    }

    loadFrom(file) {
        if (!Utils.isExistFile(file)) { return 1; }

        let data = fs.readFileSync(file, 'utf8');
        let json = JSON.parse(data);
        this['favList'] = json['addons'];

        return 0;
    }

    saveTo(file) {
        fs.writeFileSync(file, JSON.stringify(
            {
                'addons': this['favList'],
            },
            null,
            '  '
        ));
    }
}
