'use strict';

import fs from 'fs';
import fsext from 'fs-extra';
import del from 'del';


async function installAddon($scope, key, repo, cb) {
    try {
        logger.category('app').info("Downloding add-on '" + repo['bl_info']['name'] + "' from " + repo['download_url']);
        let target = "";
        if ($scope.blVerSelect === 'Custom') {
            target = $scope.customDir;
        }
        else {
            target = blamOS.getAddonPath($scope.blVerSelect);
        }
        if (target == null) {
            // try to make add-on dir.
            blamOS.createAddonDir($scope.blVerSelect);
            target = blamOS.getAddonPath($scope.blVerSelect);
            if (target == null) { throw new Error("Failed to make add-on directory"); }
        }

        // download and extract add-on
        let downloadTo = target + blamOS.getPathSeparator() + repo['bl_info']['name'] + ".zip";
        logger.category('app').info("Save to " + downloadTo + " ...");
        const download = await Utils.downloadFile(config, repo['download_url'], downloadTo);
        const extract = await Utils.extractZipFile(downloadTo, target, true);

        let extractedPath = target + blamOS.getPathSeparator() + repo['repo_name'] + '-master';
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
            basePath += sp[i] + blamOS.getPathSeparator();
        }
        if (isPackage) {
            let list = fs.readdirSync(basePath);
            for (let i = 0; i < list.length; ++i) {
                copingFiles.push({ 'path': basePath + list[i], 'filename': list[i]} );
            }
        }
        else {
            let modPath = basePath + blamOS.getPathSeparator() + sp[sp.length - 1];
            copingFiles.push({'path': modPath, 'filename': sp[sp.length - 1]});
        }
        // copy add-on to add-on directory
        let targetDir = target;
        if (isPackage) {
            let keyAfter = key.replace(/[\.\s]/g, '_');
            targetDir = target + blamOS.getPathSeparator() + keyAfter;
            fs.mkdirSync(targetDir);
        }
        for (let i = 0; i < copingFiles.length; ++i) {
            let source = copingFiles[i]['path'];
            let target = targetDir + blamOS.getPathSeparator() + copingFiles[i]['filename'];
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


