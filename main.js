'use strict';

var fs = require('fs');
var electron = require('electron');

var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var crashReporter = electron.crashReporter;

var mainWindow = null;

const DEBUG = false;

crashReporter.start({
    productName: 'Blender Add-on Manager',
    companyName: 'COLORFUL PICO',
    submitURL: '',
    autoSubmit: false
});


app.on('window-all-closed', function() {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

app.on('ready', function() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        nodeIntegration: false,
        icon: __dirname + '/icon/icon.png'
    });
    mainWindow.setMenu(null);

    if (DEBUG) { mainWindow.openDevTools(); }

    mainWindow.loadURL('file://' + __dirname + '/html/index.html');
    mainWindow.show();

    mainWindow.on('closed', function() {
        mainWindow = null;
    });
});
