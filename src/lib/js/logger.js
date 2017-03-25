'use strict';

import path from 'path';
import log4js from 'log4js';
import log4jsExt from 'log4js-extend';


export default class Logger
{
    constructor () {
        let config = {
          "log4js": {
            "level": "ALL",
            "configure": {
              "appenders": [
                {
                  "category": "lib",
                  "type": "file",
                  "filename": "logs/lib.log"
                },
                {
                  "category": "app",
                  "type": "file",
                  "filename": "logs/app.log"
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
