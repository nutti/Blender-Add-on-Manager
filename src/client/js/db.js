'use strict';

import {
        DB_DIR, GITHUB_ADDONS_DB, INSTALLED_ADDONS_DB, IGNORE_ADDONS_DB, CUSTOM_DIR_DB
} from 'blam-constants';


function loadGitHubAddonDB() {
    if (!Utils.isExistFile(GITHUB_ADDONS_DB)) { return {}; }

    logger.category('app').info("Loading GitHub add-ons DB file ...");
    blamDB.loadFrom(GITHUB_ADDONS_DB);
}

function loadInstalledAddonsDB() {
    if (!Utils.isExistFile(INSTALLED_ADDONS_DB)) { return {}; }

    logger.category('app').info("Loading installed add-ons DB file ...");
    blamLocal.loadFrom(INSTALLED_ADDONS_DB);
}

function loadIgnoreAddonDB() {
    if (!Utils.isExistFile(IGNORE_ADDONS_DB)) { return; }
    logger.category('app').info("Loading ignore add-ons DB file ...");
    blamIgnore.loadFrom(IGNORE_ADDONS_DB);
}

function loadCustomDirDB() {
    if (!Utils.isExistFile(CUSTOM_DIR_DB)) { return; }
    logger.category('app').info("Loading custom dirs DB file ...");
    blamCustomDir.loadFrom(CUSTOM_DIR_DB);
}


function updateInstalledAddonDB($scope) {
    blamLocal.update();

    if (!Utils.isExistFile(DB_DIR)) {
        fs.mkdirSync(DB_DIR);
    }
    blamLocal.saveTo(INSTALLED_ADDONS_DB);

    loadInstalledAddonsDB();
    $scope.addonStatus = Blam.updateAddonStatus(blamDB.getAddonList(),
                                                blamLocal.getAddonList(),
                                                $scope.blVerList);
}
