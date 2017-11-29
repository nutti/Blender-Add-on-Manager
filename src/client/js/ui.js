'use strict';


function redrawApp($scope)
{
    setTimeout(function () {
        $scope.$apply();
    }, 1);
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

