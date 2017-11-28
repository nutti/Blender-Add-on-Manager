# Blender Add-on Manager

This is the application to manage add-on released on GitHub.
You can install/uninstall/update all add-on's released on GitHub with this application.


## Download URL

|Version|Download URL|
|---|---|
|1.1|[Download](https://github.com/nutti/Blender-Add-on-Manager/releases/tag/v1.1)|
|1.0|[Download](https://github.com/nutti/Blender-Add-on-Manager/releases/tag/v1.0)|
|0.3|[Download](https://github.com/nutti/Blender-Add-on-Manager/releases/tag/v0.3)|
|0.2|[Download](https://github.com/nutti/Blender-Add-on-Manager/releases/tag/v0.2)|
|0.1|[Download](https://github.com/nutti/Blender-Add-on-Manager/releases/tag/v0.1)|


## Support Languages

The list of languages supported by this application is shown below.
If you want to support other languages, please send me translated strings.

* English (Default)
* Spanish
  * Contributed by @Oxer

## Features

This application has features as follows.

* Search add-ons released on GitHub (more than 2,000 add-ons are avaliable)
* Manage add-ons
  * Install add-on released on GitHub
  * Uninstall add-on which is already installed (only **External** support level)
  * Update add-on released on GitHub
  * Favorite
* Migrate add-ons among different Blender version


## Tutorials

See [Wiki Page](https://github.com/nutti/Blender-Add-on-Manager-for-GitHub/wiki/Tutorial_EN)


## Related Links

Project "Blender Add-on Manager" is on going.
See the link below for further details.

* [Blender Artist Thread](https://blenderartists.org/forum/showthread.php?418833-Blender-Add-on-Manager-(About-2-000-add-ons-are-available))


## Change Log

|Version|Release Date|Change Log|
|---|---|---|
|1.1|2017.XX.X|[1] Add features<br> - Favorite<br> - Migrate Add-on among different Blender version<br>[2] Support Language<br> - Spanish<br>[3] Add scroll bar<br>[4] Update Add-on Database API (server)<br>[5] Improve deletion algorithm on the add-on DB cleaner (server)|
|1.0|2017.11.9|[1] Add features<br> - Manage Custom Add-on Folder<br> - Ignore List<br>[2] Add Sorting Option in Add-on List<br>[3] Delete Add-on whose link is already broken automatically (server)<br>[4] Fix bug<br> - Failed to detect add-ons whose path contains "."|
|0.3|2017.4.11|[1] Move config/DB file to user directory<br>[2] Improve server's stability<br>[3] Error popup<br>[4] Fix bug<br> - Failed to run application developed by unidentified developer on macOS<br> - Failed to load add-on installed by this application at Blender|
|0.2|2017.4.2|[1] Support macOS<br>[2] Add feature<br> - Link button to Add-on repository<br>[3] Add Case-insensitive search<br>[4] Fix bug<br> - Failed to install when ```__init__.py``` is located on the top directory|
|0.1|2017.3.25|First release for testing|


## Bug Report / Feature Request

This project is on going.  
If you want to report problem or request feature, please make issue.

https://github.com/nutti/Blender-Add-on-Manager-for-GitHub/issues

## Contribution

If you want to contribute this project, please send pull request to **develop** branch.  
DO NOT send pull request to **master** branch.

https://github.com/nutti/Blender-Add-on-Manager/tree/develop

### Testing

only application is available.

#### Application

To build and run application for testing.

```sh
 $ git clone https://github.com/nutti/Blender-Add-on-Manager.git
 $ cd Blender-Add-on-Manager
 $ npm install
 $ bower install
 $ gulp
 $ gulp start
```

### Release

#### Application

To build and pack application for release.

```sh
 $ git clone https://github.com/nutti/Blender-Add-on-Manager.git
 $ cd Blender-Add-on-Manager
 $ npm install
 $ bower install
 $ gulp

 $ npm run build     # for Windows/linux

or

 $ node build_mac.js     # for macOS
```

#### Server

To build and launch server for release. (Linux only)

```sh
 $ git clone https://github.com/nutti/Blender-Add-on-Manager.git
 $ cd Blender-Add-on-Manager
 $ vim src/lib/js/blam-constants.js
# comment constant definition "USER_DIR" for client,
# and uncomment constant definition "USER_DIR" for server.

 $ npm install
 $ npm install electron@1.7.9
 $ bower install
 $ gulp

# make configuration file for logging into GitHub
 $ vim config.json
# {
#     "github": {
#          "username": <username>,
#          "password": <password>
#     }
# }

# install python dependencies
 $ mkdir venv
 $ virtualenv venv
 $ source venv/bin/activate
 $ pip install -r requirements.txt

# run API server
 $ cd src/server
 $ sh run.sh
# run Blender add-on information collector
 $ cd ../..
 $ cd build/server/js
 $ forever start bladdon_collector.js
# run Blender add-on information cleaner (optional)
 $ node bladdon_cleaner.js
```


## License

MIT License.
