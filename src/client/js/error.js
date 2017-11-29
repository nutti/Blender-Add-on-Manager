'use strict';

// handle error
function handleException($scope, e) {
    logger.category('app').error(e);
    showErrorPopup($scope, e.name, e.message, e.stack);
    redrawApp($scope);
}
