'use strict';

import path from 'path';
import log4js from 'log4js';
import log4jsExt from 'log4js-extend';

import * as Utils from 'utils';

const MAX_LOG_SIZE = 3 * 1024 * 1024;       // 3MiB
const MAX_BACKUPS = 3;

export default class Logger
{
    constructor () {
        let cwd = Utils.getCwd();
        let config = {
          "log4js": {
            "level": "ALL",
            "configure": {
              "appenders": [
                {
                  "category": "lib",
                  "type": "file",
                  "backups": MAX_BACKUPS,
                  "maxLogSize": MAX_LOG_SIZE,
                  "filename": cwd + "/logs/lib.log"
                },
                {
                  "category": "app",
                  "type": "file",
                  "backups": MAX_BACKUPS,
                  "maxLogSize": MAX_LOG_SIZE,
                  "filename": cwd + "/logs/app.log"
                }
             ]
            }
          }
        };

        console.log("Initializing logger ...");
        log4js.configure(config['log4js']['configure']);
        log4jsExt(log4js, {
            path: __dirname,
            format: "(@name) [@file:@line:@column]"
        });
        this['log'] = {
            lib: log4js.getLogger('lib'),
            app: log4js.getLogger('app')
        };
        for (let category in this['log']) {
            this['log'][category].setLevel(config['log4js']['level']);
        }
    }

    category (category) {
        return this['log'][category];
    }

    debug (category, msg) {
        this['log'][category].debug(msg);
    }

    info (category, msg) {
        this['log'][category].info(msg);
    }

    warn (category, msg) {
        this['log'][category].warn(msg);
    }

    error (category, msg) {
        this['log'][category].error(msg);
    }

    fatal (category, msg) {
        this['log'][category].fatal(msg);
    }
}
