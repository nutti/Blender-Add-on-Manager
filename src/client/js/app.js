'use strict';

import fs from 'fs';
import fsext from 'fs-extra';
import del from 'del';
import electron from 'electron';
import * as Utils from 'utils';

let cwd = Utils.getCwd();

import BlAddonDB from 'bl_add-on_db';
const builder = new BlAddonDB();
import BlAddonChecker from 'bl_addon_checker';
const checker = new BlAddonChecker();
import TaskMgr from 'task';
const taskMgr = new TaskMgr();
import Logger from 'logger';
const logger = new Logger();
import * as BlAddon from 'bl-addon';


var DB_DIR = cwd + '/db';
var API_VERSION_FILE = cwd + '/db/version';
var GITHUB_ADDONS_DB = cwd + '/db/add-on_list.db';
var INSTALLED_ADDONS_DB = cwd + '/db/installed_add-on_list.db';
var CONFIG_FILE_PATH = cwd + '/config/config.json';
var BL_INFO_UNDEF = "626c5f696e666f5f@UNDEF";

var config = null;
var app = angular.module('blAddonMgr', [])


app.controller('MainController', function ($scope, $timeout) {
    // read configuration file
    if (!Utils.isExistFile(CONFIG_FILE_PATH)) { throw new Error(CONFIG_FILE_PATH + "is not exist"); }
    var text = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
    config = JSON.parse(text);
    // initialize
    builder.init(config);

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

    function setTaskAndUpdate(taskName)
    {
        taskMgr.setTask(taskName);
        updateTask();
    }

    function advanceProgressAndUpdate()
    {
        taskMgr.advanceProgress();
        updateTask();
    }

    function updateTask()
    {
        setTimeout(function () {
            $scope.task = {
                'progress': taskMgr.genProgressString(),
                'progressRate': taskMgr.getCurTaskProgressRate()
            };
            $scope.$apply();
        }, 1);
    }

    function completeTask(addon)
    {
        advanceProgressAndUpdate();
        setTimeout(function () {
            $scope.task = {
                'progress': taskMgr.genProgressString() + " '" + addon + "'",
                'progressRate': 1.0
            };
            $scope.$apply();
        }, 1);
    }

    function redrawApp()
    {
        setTimeout(function () {
            $scope.$apply();
        }, 1);
    }

    $scope.blVerList = checker.getInstalledBlVers();
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
    $scope.customAddonDirList = [];

    $scope.githubAddons = loadGitHubAddonDB();
    $scope.installedAddons = loadInstalledAddonsDB();
    $scope.addonStatus = BlAddon.updateAddonStatus($scope.githubAddons, $scope.installedAddons, $scope.blVerList);


    var main = this;
    main.repoList = [];

    $scope.blVerSelect = $scope.blVerList[0];
    $scope.showBlVerSelect = true;
    $scope.isOpsLocked = false;

    $scope.onAddonSelectorChanged = onAddonSelectorChanged;

    // "Update GitHub DB" button
    $scope.onGitHubDBBtnClicked = function ($event) {
        updateGitHubAddonDB();
    };

    // "Update Install DB" button
    $scope.onInstDBBtnClicked = function ($event) {
        updateInstalledAddonDB();
    };

    // show error popup
    function openErrorPopup() {
        $('.error-popup').css('display', 'none');
    }

    openErrorPopup();

    async function updateGitHubAddonDB() {
        $scope.isOpsLocked = true;
        redrawApp();
        if (!Utils.isExistFile(DB_DIR)) {
            fs.mkdirSync(DB_DIR);
        }
        const version = await builder.makeAPIStatusFile(API_VERSION_FILE);
        const fetch = await builder.fetchFromDBServer(GITHUB_ADDONS_DB);
        $scope.githubAddons = loadGitHubAddonDB();
        $scope.addonStatus = BlAddon.updateAddonStatus($scope.githubAddons, $scope.installedAddons, $scope.blVerList);
        onAddonSelectorChanged();
        $scope.isOpsLocked = false;
        redrawApp();
    }

    function updateInstalledAddonDB() {
        checker.checkInstalledBlAddon();
        if (!Utils.isExistFile(DB_DIR)) {
            fs.mkdirSync(DB_DIR);
        }
        checker.saveTo(INSTALLED_ADDONS_DB);
        $scope.installedAddons = loadInstalledAddonsDB();
        $scope.addonStatus = BlAddon.updateAddonStatus($scope.githubAddons, $scope.installedAddons, $scope.blVerList);
        onAddonSelectorChanged();
    }


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

    $scope.openCustomAddonDir = () => {
        const remote = electron.remote;
        const dialog = remote.dialog;
        dialog.showOpenDialog(null, {
            properties: ['openDirectory'],
            title: 'Select Custom Add-on Folder',
            defaultPath: '.'
        }, (folderName) => {
            $scope.customAddonDir = folderName;
            redrawApp();
        });
    };

    $scope.addCustomAddonDir = () => {
        let total = $scope.customAddonDirList.length;
        let dir = $scope.customAddonDir;
        if (!Utils.isDirectory(dir)) { return; }
        console.log(dir);
        $scope.customAddonDirList.push({
            id: total,
            dir: dir
        });
        consle.log($scope.customAddonDirList);
    };

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
                    addons = BlAddon.filterAddons(
                        $scope.addonStatus,
                        'installed',
                        ['INSTALLED', 'UPDATABLE'],
                        blVer,
                        activeCategory,
                        searchStr);
                }
                $scope.addonInfoTpl = 'partials/addon-info/installed.html';
                break;
            case 'github':
                logger.category('app').info("Show GitHub add-on list");
                if ($scope.addonStatus) {
                    addons = BlAddon.filterAddons(
                        $scope.addonStatus,
                        'github',
                        ['INSTALLED', 'NOT_INSTALLED', 'UPDATABLE'],
                        blVer,
                        activeCategory,
                        searchStr);
                }
                $scope.addonInfoTpl = 'partials/addon-info/github.html';
                break;
            case 'update':
                logger.category('app').info("Show Updatable add-on list");
                if ($scope.addonStatus) {
                    addons = BlAddon.filterAddons(
                        $scope.addonStatus,
                        'installed',
                        ['UPDATABLE'],
                        blVer,
                        activeCategory,
                        searchStr);
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


        async function installAddon(key, repo, cb) {
            try {
                logger.category('app').info("Downloding add-on '" + repo['bl_info']['name'] + "' from " + repo['download_url']);
                let target = checker.getAddonPath($scope.blVerSelect);
                if (target == null) {
                    // try to make add-on dir.
                    checker.createAddonDir($scope.blVerSelect);
                    target = checker.getAddonPath($scope.blVerSelect);
                    if (target == null) { throw new Error("Failed to make add-on directory"); }
                }

                // download and extract add-on
                let downloadTo = target + checker.getPathSeparator() + repo['bl_info']['name'] + ".zip";
                logger.category('app').info("Save to " + downloadTo + " ...");
                const download = await Utils.downloadFile(config, repo['download_url'], downloadTo);
                const extract = await Utils.extractZipFile(downloadTo, target, true);

                let extractedPath = target + checker.getPathSeparator() + repo['repo_name'] + '-master';
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
                advanceProgressAndUpdate();
                advanceProgressAndUpdate();
                let basePath = "";
                for (let i = 0; i < sp.length - 1; ++i) {
                    basePath += sp[i] + checker.getPathSeparator();
                }
                if (isPackage) {
                    let list = fs.readdirSync(basePath);
                    for (let i = 0; i < list.length; ++i) {
                        copingFiles.push({ 'path': basePath + list[i], 'filename': list[i]} );
                    }
                }
                else {
                    let modPath = basePath + checker.getPathSeparator() + sp[sp.length - 1];
                    copingFiles.push({'path': modPath, 'filename': sp[sp.length - 1]});
                }
                // copy add-on to add-on directory
                let targetDir = target;
                if (isPackage) {
                    targetDir = target + checker.getPathSeparator() + key;
                    fs.mkdirSync(targetDir);
                }
                for (let i = 0; i < copingFiles.length; ++i) {
                    let source = copingFiles[i]['path'];
                    let target = targetDir + checker.getPathSeparator() + copingFiles[i]['filename'];
                    fsext.copySync(source, target);
                }
                advanceProgressAndUpdate();
                // delete garbage data
                del.sync([extractedPath], {force: true});

                cb();
            }
            catch (e) {
                logger.category('app').error(e);
            }
        }

        function removeAddon(repo) {
            var deleteFrom = repo['src_path'];
            if (!deleteFrom) { throw new Error(deleteFrom + "is not found"); }
            logger.category('app').info("Deleting '" + deleteFrom + "' ...");
            advanceProgressAndUpdate();
            var result = del.sync([deleteFrom], {force: true});
            logger.category('app').info("Deleted '" + deleteFrom + "'");
        }

        function onLnBtnClicked($event) {
            let repoIndex = $($event.target).data('repo-index');
            let repo = $scope.addonStatus[main.repoList[repoIndex]]['github'];
            let url = repo['url'];
            electron.shell.openExternal(url);
        }

        function onDlBtnClicked($event) {
            setTaskAndUpdate('INSTALL');
            let repoIndex = $($event.target).data('repo-index');
            let repo = $scope.addonStatus[main.repoList[repoIndex]]['github'];
            let key = main.repoList[repoIndex];
            $scope.isOpsLocked = true;
            installAddon(key, repo, () => {
                try {
                    advanceProgressAndUpdate();
                    updateInstalledAddonDB();
                    advanceProgressAndUpdate();
                    $scope.isOpsLocked = false;
                    completeTask(repo['bl_info']['name']);
                }
                catch (e) {
                    logger.category('app').err(e);
                }
            });
        }

        function onRmBtnClicked($event) {
            try {
                setTaskAndUpdate('REMOVE');
                let repoIndex = $($event.target).data('repo-index');
                let repo = $scope.addonStatus[main.repoList[repoIndex]]['installed'][blVer];
                $scope.isOpsLocked = true;
                removeAddon(repo);
                advanceProgressAndUpdate();
                updateInstalledAddonDB();
                $scope.isOpsLocked = false;
                completeTask(repo['bl_info']['name']);
            }
            catch (e) {
                logger.category('app').err(e);
            }
        }

        function onUpBtnClicked($event) {
            setTaskAndUpdate('UPDATE');
            let repoIndex = $($event.target).data('repo-index');
            let repoInstalled = $scope.addonStatus[main.repoList[repoIndex]]['installed'][blVer];
            let repoGitHub = $scope.addonStatus[main.repoList[repoIndex]]['github'];
            let key = main.repoList[repoIndex];
            $scope.isOpsLocked = true;
            try {
                removeAddon(repoInstalled);
            }
            catch (e) {
                logger.category('app').err(e);
            }
            installAddon(key, repoGitHub, () => {
                try {
                    advanceProgressAndUpdate();
                    updateInstalledAddonDB();
                    advanceProgressAndUpdate();
                    $scope.isOpsLocked = false;
                    completeTask(repoGitHub['bl_info']['name']);
                }
                catch (e) {
                    logger.category('app').err(e);
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

function loadGitHubAddonDB() {
    if (!Utils.isExistFile(GITHUB_ADDONS_DB)) { return {}; }
    logger.category('app').info("Loading GitHub add-ons DB file ...");
    return builder.readDBFile(GITHUB_ADDONS_DB);
}

function loadInstalledAddonsDB() {
    if (!Utils.isExistFile(INSTALLED_ADDONS_DB)) { return {}; }
    logger.category('app').info("Loading installed add-ons DB file ...");
    return builder.readDBFile(INSTALLED_ADDONS_DB);
}
