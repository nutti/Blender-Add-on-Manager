'use strict';

import electron from 'electron';

export const USER_DIR = electron.remote.app.getPath('userData');
export const DB_DIR = USER_DIR + '/db';
export const API_VERSION_FILE = DB_DIR + '/version';
export const GITHUB_ADDONS_DB = DB_DIR + '/add-on_list.db';
export const INSTALLED_ADDONS_DB = DB_DIR + '/installed_add-on_list.db';
export const IGNORE_ADDONS_DB = DB_DIR + '/ignore_add-on_list.db';
export const CONFIG_DIR = USER_DIR + '/config';
export const CONFIG_FILE_PATH = CONFIG_DIR + '/config.json';
export const BL_INFO_UNDEF = "626c5f696e666f5f@UNDEF";

export const GITHUB_URL = 'https://github.com';

export const DB_NAME = 'blAddonMgr';
export const COLLECTION_NAME = 'blAddonGitHub';
export const DB_HOSTNAME = 'localhost';
export const DB_PORT = 27017;

export const MAX_LOG_SIZE = 3 * 1024 * 1024;       // 3MiB
export const MAX_BACKUPS = 3;
export const LOG_DIR = USER_DIR + '/logs';

export const CONFIG_FILE_INIT =
`{
    "db": {
        "server": "colorful-pico.net",
        "port": "5000",
        "api": "/api/bl-addon-db",
        "endpoint": {
            "addon-list": "/addon-list",
            "addon-total": "/addon-total",
            "version": "/version",
            "services": "/services"
        }
    }
}`;
