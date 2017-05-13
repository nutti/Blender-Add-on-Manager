'use strict';

import fs from 'fs';
import fsext from 'fs-extra';
import del from 'del';
import electron from 'electron';
import * as Utils from 'utils';

import BlamDB from 'blam-db';
const blamDB = new BlamDB();
import BlamLocal from 'blam-local';
const blamLocal = new BlamLocal();
import BlamIgnore from 'blam-ignore';
const blamIgnore = new BlamIgnore();
import TaskMgr from 'task';
const taskMgr = new TaskMgr();
import Logger from 'logger';
const logger = new Logger();
import * as Blam from 'blam';

import {
        DB_DIR, API_VERSION_FILE, GITHUB_ADDONS_DB, INSTALLED_ADDONS_DB, IGNORE_ADDONS_DB,
        CONFIG_DIR, CONFIG_FILE_PATH, BL_INFO_UNDEF, CONFIG_FILE_INIT
} from 'blam-constants';


var config = null;
var app = angular.module('blAddonMgr', [])

function redrawApp($scope)
{
    setTimeout(function () {
        $scope.$apply();
    }, 1);
}

// handle error
function handleException($scope, e) {
    logger.category('app').error(e);
    showErrorPopup($scope, e.name, e.message, e.stack);
    redrawApp($scope);
}

// show error popup
function showErrorPopup($scope, title, msg, trace) {
    $('.error-popup').css('display', 'block');
    $('.error-popup-background').css('display', 'block');
    $scope.errTitle = title;
    $scope.errMsg = msg;
    $scope.errCallTrace = trace;
}

// close
function hideErrorPopup($scope) {
    $('.error-popup').css('display', 'none');
    $('.error-popup-background').css('display', 'none');
    $scope.errTitle = "";
    $scope.errMsg = "";
    $scope.errCallTrace = "";
    $scope.isOpsLocked = false;
    redrawApp($scope);
}

// show ignore-list popup
function showIgnoreListPopup($scope) {
    $('.ignore-list-popup').css('display', 'block');
    $('.ignore-list-popup-background').css('display', 'block');
}

// close ignore-list popup
function hideIgnoreListPopup($scope) {
    $('.ignore-list-popup').css('display', 'none');
    $('.ignore-list-popup-background').css('display', 'none');
}

// show customdir-list popup
function showCustomdirListPopup($scope) {
    $('.customdir-list-popup').css('display', 'block');
    $('.customdir-list-popup-background').css('display', 'block');
}

// close customdir-list popup
function hideCustomdirListPopup($scope) {
    $('.customdir-list-popup').css('display', 'none');
    $('.customdir-list-popup-background').css('display', 'none');
}

function loadGitHubAddonDB() {
    if (!Utils.isExistFile(GITHUB_ADDONS_DB)) { return {}; }
    logger.category('app').info("Loading GitHub add-ons DB file ...");
    return blamDB.readDBFile(GITHUB_ADDONS_DB);
}

function loadInstalledAddonsDB() {
    if (!Utils.isExistFile(INSTALLED_ADDONS_DB)) { return {}; }
    logger.category('app').info("Loading installed add-ons DB file ...");
    return blamDB.readDBFile(INSTALLED_ADDONS_DB);
}

function loadIgnoreAddonDB() {
    if (!Utils.isExistFile(IGNORE_ADDONS_DB)) { return; }
    logger.category('app').info("Loading ignore add-ons DB file ...");
    blamIgnore.loadFrom(IGNORE_ADDONS_DB);
}



async function installAddon($scope, key, repo, cb) {
    try {
        logger.category('app').info("Downloding add-on '" + repo['bl_info']['name'] + "' from " + repo['download_url']);
        let target = blamLocal.getAddonPath($scope.blVerSelect);
        if (target == null) {
            // try to make add-on dir.
            blamLocal.createAddonDir($scope.blVerSelect);
            target = blamLocal.getAddonPath($scope.blVerSelect);
            if (target == null) { throw new Error("Failed to make add-on directory"); }
        }

        // download and extract add-on
        let downloadTo = target + blamLocal.getPathSeparator() + repo['bl_info']['name'] + ".zip";
        logger.category('app').info("Save to " + downloadTo + " ...");
        const download = await Utils.downloadFile(config, repo['download_url'], downloadTo);
        const extract = await Utils.extractZipFile(downloadTo, target, true);

        let extractedPath = target + blamLocal.getPathSeparator() + repo['repo_name'] + '-master';
        let srcPath = extractedPath + repo['src_dir'] + '/' + repo['src_main'];
        let sp = srcPath.split(/[\/\\]/);
        let copingFiles = [];
        let isPackage = false;
        // Package
        if (sp[sp.length - 1] == "__init__.py") {
            isPackage = true;
        }
        // Module
        else {
            isPackage = false;
        }
        advanceProgressAndUpdate($scope);
        advanceProgressAndUpdate($scope);
        let basePath = "";
        for (let i = 0; i < sp.length - 1; ++i) {
            basePath += sp[i] + blamLocal.getPathSeparator();
        }
        if (isPackage) {
            let list = fs.readdirSync(basePath);
            for (let i = 0; i < list.length; ++i) {
                copingFiles.push({ 'path': basePath + list[i], 'filename': list[i]} );
            }
        }
        else {
            let modPath = basePath + blamLocal.getPathSeparator() + sp[sp.length - 1];
            copingFiles.push({'path': modPath, 'filename': sp[sp.length - 1]});
        }
        // copy add-on to add-on directory
        let targetDir = target;
        if (isPackage) {
            let keyAfter = key.replace(/[\.\s]/g, '_');
            targetDir = target + blamLocal.getPathSeparator() + keyAfter;
            fs.mkdirSync(targetDir);
        }
        for (let i = 0; i < copingFiles.length; ++i) {
            let source = copingFiles[i]['path'];
            let target = targetDir + blamLocal.getPathSeparator() + copingFiles[i]['filename'];
            fsext.copySync(source, target);
        }
        advanceProgressAndUpdate($scope);
        // delete garbage data
        del.sync([extractedPath], {force: true});

        cb();
    }
    catch (e) {
        handleException($scope, e);
    }
}

function removeAddon($scope, repo) {
    try {
        var deleteFrom = repo['src_path'];
        if (!deleteFrom) { throw new Error(deleteFrom + "is not found"); }
        logger.category('app').info("Deleting '" + deleteFrom + "' ...");
        advanceProgressAndUpdate($scope);
        var result = del.sync([deleteFrom], {force: true});
        logger.category('app').info("Deleted '" + deleteFrom + "'");
    }
    catch (e) {
        handleException($scope, e);
    }
}

function setTaskAndUpdate($scope, taskName)
{
    taskMgr.setTask(taskName);
    updateTask($scope);
}

function advanceProgressAndUpdate($scope)
{
    taskMgr.advanceProgress();
    updateTask($scope);
}

function updateTask($scope)
{
    setTimeout(function () {
        $scope.task = {
            'progress': taskMgr.genProgressString(),
            'progressRate': taskMgr.getCurTaskProgressRate()
        };
        $scope.$apply();
    }, 1);
}

function completeTask($scope, addon)
{
    advanceProgressAndUpdate($scope);
    setTimeout(function () {
        $scope.task = {
            'progress': taskMgr.genProgressString() + " '" + addon + "'",
            'progressRate': 1.0
        };
        $scope.$apply();
    }, 1);
}

// make task
taskMgr.makeTasks(['INSTALL', 'REMOVE', 'UPDATE']);
taskMgr.addItems(
    'INSTALL',
    [
        'Downloading Add-on ...',
        'Extracting Add-on ...',
        'Installing Add-on ...',
        'Cleaning up ...',
        'Updating Installed Add-on Database ...',
        'Updating Internal Information ...'
    ]
);
taskMgr.setCompletionString('INSTALL', 'Installed Add-on');

taskMgr.addItems(
    'REMOVE',
    [
        'Removing Add-on ...',
        'Updating Installed Add-on Database ...',
        'Updating Internal Information ...'
    ]
)
taskMgr.setCompletionString('REMOVE', 'Deleted Add-on');

taskMgr.addItems(
    'UPDATE',
    [
        'Removing Add-on ...',
        'Downloading Add-on ...',
        'Extracting Add-on ...',
        'Installing Add-on ...',
        'Cleaning up ...',
        'Updating Installed Add-on Database ...',
        'Updating Internal Information ...'
    ]
)
taskMgr.setCompletionString('UPDATE', 'Updated Add-on');


app.controller('MainController', function ($scope, $timeout) {

    var main = this;
    main.repoList = [];

    $scope.blVerList = blamLocal.getInstalledBlVers();
    $scope.blVerSelect = $scope.blVerList[0];
    $scope.showBlVerSelect = true;

    $scope.addonOrderItemList = [
        {name: 'Sort:', value: ''},
        {name: 'Add-on Name', value: 'ADDON_NAME'},
        {name: 'Author', value: 'AUTHOR'}
    ];
    $scope.addonOrderItemSelect = $scope.addonOrderItemList[0];

    $scope.onAddonSelectorChanged = onAddonSelectorChanged;

    //$scope.blVerList.push('Custom');
    $scope.addonCategories = [
        {id: 1, name: 'All', value: 'All'},
        {id: 2, name: '3D View', value: '3D View'},
        {id: 3, name: 'Add Curve', value: 'Add Curve'},
        {id: 4, name: 'Add Mesh', value: 'Add Mesh'},
        {id: 5, name: 'Animation', value: 'Animation'},
        {id: 6, name: 'Development', value: 'Development'},
        {id: 7, name: 'Game Engine', value: 'Game Engine'},
        {id: 8, name: 'Import-Export', value: 'Import-Export'},
        {id: 9, name: 'Material', value: 'Material'},
        {id: 10, name: 'Mesh', value: 'Mesh'},
        {id: 11, name: 'Node', value: 'Node'},
        {id: 12, name: 'Object', value: 'Object'},
        {id: 13, name: 'Paint', value: 'Paint'},
        {id: 14, name: 'Pie Menu', value: 'Pie Menu'},
        {id: 15, name: 'Render', value: 'Render'},
        {id: 16, name: 'Rigging', value: 'Rigging'},
        {id: 17, name: 'System', value: 'System'},
        {id: 18, name: 'UI', value: 'UI'},
        {id: 19, name: 'UV', value: 'UV'}
    ];
    $scope.addonLists = [
        {id: 1, name: 'Installed', value: 'installed'},
        {id: 2, name: 'GitHub', value: 'github'},
        {id: 3, name: 'Update', value: 'update'}
    ];
    $scope.customDirItemList = [];
    $scope.addonListActive = 1;
    $scope.addonOrder = 'ASCEND';

    // "Update GitHub DB" button
    $scope.onGitHubDBBtnClicked = function ($event) {
        updateGitHubAddonDB($scope);
    };

    // "Update Install DB" button
    $scope.onInstDBBtnClicked = function ($event) {
        updateInstalledAddonDB($scope);
    };

    // "Manage Ignore DB button"
    $scope.onIgnDBBtnClicked = function ($event) {
        showIgnoreListPopup($scope);
    };

    // "Add Custom Directory button"
    $scope.onCustomDirBtnClicked = function ($event) {
        showCustomdirListPopup($scope);
    };

    function updateIgnoreList($scope) {
        $scope.ignoreList = blamIgnore.getList();
        $scope.ignoreCandItemList = [];
        let keys = Object.keys($scope.addonStatus);
        for (let i = 0; i < keys.length; ++i) {
            let k = keys[i];
            if ($scope.addonStatus[k]['installed']) {
                if (!blamIgnore.ignored(k)) {
                    $scope.ignoreCandItemList.push(k);
                }
            }
        }
    }

    // "Add to Ignore List" button
    $scope.onAddIgnBtnClicked = function ($event) {
        blamIgnore.addItem($scope.ignoreCandListSelect);
        updateIgnoreList($scope);
        blamIgnore.saveTo(IGNORE_ADDONS_DB);
    };

    // "Remove From Ignore List" button
    $scope.onRmIgnBtnClicked = function ($event) {
        blamIgnore.removeItem($scope.ignoreListSelect);
        updateIgnoreList($scope);
        blamIgnore.saveTo(IGNORE_ADDONS_DB);
    };

    $scope.isAddonListActive = function (index) {
        if ($scope.addonListActive == undefined) {
            $scope.onAddonListSelectorChanged(0);
        }
        return $scope.addonListActive == index;
    };

    $scope.isAddonCategoryActive = function (index) {
        if ($scope.addonCategoryActive == undefined) {
            $scope.onAddonCategorySelectorChanged(0);
        }
        return $scope.addonCategoryActive[index];
    };

    $scope.onAddonListSelectorChanged = function (index) {
        $scope.activeAddonList = $scope.addonLists[index].value;
        $scope.addonListActive = index;
        onAddonSelectorChanged();
    };

    $scope.onAddonCategorySelectorChanged = function (index) {
        if ($scope.addonCategoryActive == undefined) {
            $scope.addonCategoryActive = Array.apply(null, Array($scope.addonCategories.length)).map(() => {return false});
        }
        $scope.addonCategoryActive[index] = !$scope.addonCategoryActive[index];
        onAddonSelectorChanged();
    };

    $scope.onSearchBarUpdated = (event) => {
        $scope.searchStr = event.target.value;
        onAddonSelectorChanged();
    };


    $scope.blStr = (content, str) => {
        if (str != BL_INFO_UNDEF) { return str; }
        var def = {
            'title': "(No Title)",
            'description': "(No Description)",
            'author': "(Annonymous)",
            'bl-version': "-",
            'version': "-",
            'category': "-"
        };
        return def[content];
    };

    $scope.getAddonStatus = (key) => {
        return $scope.addonStatus[key]['status'][$scope.blVerSelect];
    };

    $scope.targetIsCustomDir = () => {
        return $scope.blVerSelect === 'Custom';
    };

    $scope.customAddonDir = "";

    $scope.onOpenCustomDirBtnClicked = () => {
        const remote = electron.remote;
        const dialog = remote.dialog;
        dialog.showOpenDialog(null, {
            properties: ['openDirectory'],
            title: 'Select Custom Add-on Folder',
            defaultPath: '.'
        }, (folderName) => {
            $scope.customDir = folderName;
            redrawApp($scope);
        });
    };

    $scope.onAddCustomDirBtnClicked = () => {
        let dir = $scope.customDir;
        if (!Utils.isDirectory(dir)) { return; }
        console.log(dir);
        $scope.customDirItemList.push(dir);
        consle.log($scope.customAddonDirList);
    };


    async function initApp() {
        $scope.isOpsLocked = true;
        redrawApp($scope);

        // setup users directory
        if (!Utils.isExistFile(DB_DIR)) { fs.mkdirSync(DB_DIR); }
        if (!Utils.isExistFile(CONFIG_DIR)) { fs.mkdirSync(CONFIG_DIR); }

        // make config.json
        if (!Utils.isExistFile(CONFIG_FILE_PATH)) {
            fs.writeFileSync(CONFIG_FILE_PATH, CONFIG_FILE_INIT);
        }

        // read configuration file
        let text = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
        config = JSON.parse(text);
        // initialize
        blamDB.init(config);

        // make installed add-on DB
        if (!Utils.isExistFile(INSTALLED_ADDONS_DB)) {
            blamLocal.checkInstalledBlAddon();
            blamLocal.saveTo(INSTALLED_ADDONS_DB);
        }

        // make github add-on DB
        if (!Utils.isExistFile(GITHUB_ADDONS_DB)) {
            const version = await blamDB.makeAPIStatusFile(API_VERSION_FILE);
            const fetch = await blamDB.fetchFromDBServer(GITHUB_ADDONS_DB);
        }

        $scope.githubAddons = loadGitHubAddonDB();
        $scope.installedAddons = loadInstalledAddonsDB();
        loadIgnoreAddonDB();
        $scope.addonStatus = Blam.updateAddonStatus($scope.githubAddons, $scope.installedAddons, $scope.blVerList);

        updateIgnoreList($scope);

        onAddonSelectorChanged();

        $scope.isOpsLocked = false;
        redrawApp($scope);
    }


    initApp();

    $scope.closeIgnoreListPopup = () => {
        hideIgnoreListPopup($scope);
    };

    $scope.closeErrorPopup = () => {
        hideErrorPopup($scope);
    };

    $scope.closeCustomDirListPopup = () => {
        hideCustomdirListPopup($scope);
    };

    async function updateGitHubAddonDB($scope) {
        $scope.isOpsLocked = true;
        redrawApp($scope);
        if (!Utils.isExistFile(DB_DIR)) {
            fs.mkdirSync(DB_DIR);
        }
        const version = await blamDB.makeAPIStatusFile(API_VERSION_FILE);
        const fetch = await blamDB.fetchFromDBServer(GITHUB_ADDONS_DB);
        $scope.githubAddons = loadGitHubAddonDB();
        $scope.addonStatus = Blam.updateAddonStatus($scope.githubAddons, $scope.installedAddons, $scope.blVerList);
        onAddonSelectorChanged();
        $scope.isOpsLocked = false;
        redrawApp($scope);
    }

    function updateInstalledAddonDB($scope) {
        blamLocal.checkInstalledBlAddon();
        if (!Utils.isExistFile(DB_DIR)) {
            fs.mkdirSync(DB_DIR);
        }
        blamLocal.saveTo(INSTALLED_ADDONS_DB);
        $scope.installedAddons = loadInstalledAddonsDB();
        $scope.addonStatus = Blam.updateAddonStatus($scope.githubAddons, $scope.installedAddons, $scope.blVerList);
        onAddonSelectorChanged();
    }

    $scope.changedAddonOrder = onAddonSelectorChanged;


    function onAddonSelectorChanged() {
        // collect filter condition
        var activeList = $scope.addonLists[$scope.addonListActive]['value'];
        var blVer = $scope.blVerSelect;
        var activeCategory = [];
        if ($scope.addonCategoryActive != undefined) {
            var idx = $scope.addonCategoryActive.indexOf(true);
            while (idx != -1) {
                activeCategory.push($scope.addonCategories[idx]['value']);
                idx = $scope.addonCategoryActive.indexOf(true, idx + 1);
            }
        }
        var searchStr = $scope.searchStr;

        // update add-on info
        var addons = [];
        switch (activeList) {
            case 'installed':
                logger.category('app').info("Show Installed add-on list");
                if ($scope.addonStatus) {
                    addons = Blam.filterAddons(
                        $scope.addonStatus,
                        'installed',
                        ['INSTALLED', 'UPDATABLE'],
                        blVer,
                        activeCategory,
                        searchStr,
                        blamIgnore.getList());
                    addons = Blam.sortAddons(
                        $scope.addonStatus,
                        addons,
                        'installed',
                        $scope.addonOrderItemSelect.value,
                        $scope.addonOrder,
                        );
                }
                $scope.addonInfoTpl = 'partials/addon-info/installed.html';
                break;
            case 'github':
                logger.category('app').info("Show GitHub add-on list");
                if ($scope.addonStatus) {
                    addons = Blam.filterAddons(
                        $scope.addonStatus,
                        'github',
                        ['INSTALLED', 'NOT_INSTALLED', 'UPDATABLE'],
                        blVer,
                        activeCategory,
                        searchStr,
                        blamIgnore.getList());
                    addons = Blam.sortAddons(
                        $scope.addonStatus,
                        addons,
                        'github',
                        $scope.addonOrderItemSelect.value,
                        $scope.addonOrder);
                }
                $scope.addonInfoTpl = 'partials/addon-info/github.html';
                break;
            case 'update':
                logger.category('app').info("Show Updatable add-on list");
                if ($scope.addonStatus) {
                    addons = Blam.filterAddons(
                        $scope.addonStatus,
                        'installed',
                        ['UPDATABLE'],
                        blVer,
                        activeCategory,
                        searchStr,
                        blamIgnore.getList());
                }
                $scope.addonInfoTpl = 'partials/addon-info/github.html';
                break;
            default:
                return;
        }
        if (addons.length > 100) {
            addons.length = 100;
        }
        main.repoList = addons;


        function onLnBtnClicked($event) {
            let repoIndex = $($event.target).data('repo-index');
            let repo = $scope.addonStatus[main.repoList[repoIndex]]['github'];
            let url = repo['url'];
            electron.shell.openExternal(url);
        }

        function onDlBtnClicked($event) {
            setTaskAndUpdate($scope, 'INSTALL');
            let repoIndex = $($event.target).data('repo-index');
            let repo = $scope.addonStatus[main.repoList[repoIndex]]['github'];
            let key = main.repoList[repoIndex];
            $scope.isOpsLocked = true;
            installAddon($scope, key, repo, () => {
                try {
                    advanceProgressAndUpdate($scope);
                    updateInstalledAddonDB($scope);
                    advanceProgressAndUpdate($scope);
                    $scope.isOpsLocked = false;
                    completeTask($scope, repo['bl_info']['name']);
                }
                catch (e) {
                    handleException($scope, e);
                }
            });
        }

        function onRmBtnClicked($event) {
            try {
                setTaskAndUpdate($scope, 'REMOVE');
                let repoIndex = $($event.target).data('repo-index');
                let repo = $scope.addonStatus[main.repoList[repoIndex]]['installed'][blVer];
                $scope.isOpsLocked = true;
                removeAddon($scope, repo);
                advanceProgressAndUpdate($scope);
                updateInstalledAddonDB($scope);
                $scope.isOpsLocked = false;
                completeTask($scope, repo['bl_info']['name']);
            }
            catch (e) {
                handleException($scope, e);
            }
        }

        function onUpBtnClicked($event) {
            setTaskAndUpdate($scope, 'UPDATE');
            let repoIndex = $($event.target).data('repo-index');
            let repoInstalled = $scope.addonStatus[main.repoList[repoIndex]]['installed'][blVer];
            let repoGitHub = $scope.addonStatus[main.repoList[repoIndex]]['github'];
            let key = main.repoList[repoIndex];
            $scope.isOpsLocked = true;
            try {
                removeAddon($scope, repoInstalled);
            }
            catch (e) {
                handleException($scope, e);
            }
            installAddon($scope, key, repoGitHub, () => {
                try {
                    advanceProgressAndUpdate($scope);
                    updateInstalledAddonDB($scope);
                    advanceProgressAndUpdate($scope);
                    $scope.isOpsLocked = false;
                    completeTask($scope, repoGitHub['bl_info']['name']);
                }
                catch (e) {
                    handleException($scope, e);
                }
            });
        }

        // "Link" button
        $scope.onLnBtnClicked = onLnBtnClicked;
        // "Download" button
        $scope.onDlBtnClicked = onDlBtnClicked;
        // "Remove" button
        $scope.onRmBtnClicked = onRmBtnClicked;
        // "Update" button
        $scope.onUpBtnClicked = onUpBtnClicked;

    }
});
