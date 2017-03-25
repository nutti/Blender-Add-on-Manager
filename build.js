const packager = require('electron-packager');
const fs = require('fs');
const fsext = require('fs-extra');
const package = require('./package.json');

packager({
    name: package['name'],
    dir: "./build/client",
    out: "./build/app",
    icon: "./icon/icon.ico",
    //platform: "win32",
    //arch: "x64",
    platform: "all",
    arch: "all",
    electronVersion: "1.3.4",
    overwrite: true,
    asar: true,
    prune: true,
    ignore: "node_modules/electron-connect",
    "appVersion": package['version'],
    "version-string": {
        companyName: "colorful-pico.net",
        FileDescription: package['name'],
        OriginalFilename: package['name'] + ".exe",
        ProductName: package['name'],
        InternalName: package['name']
    }
}, function (err, appPaths) {
    if (err) { console.log(err); return; }
    for (var i = 0; i < appPaths.length; ++i) {
        var path = appPaths[i];
        console.log("Build is done. (path=" + path + ")");
        fs.mkdirSync(path + '/config');
        fsext.copySync('./config/config.json', path + '/config/config.json');
    }
});
