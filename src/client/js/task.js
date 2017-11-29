'use strict';

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

