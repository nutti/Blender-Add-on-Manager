'use strict';

export default class TaskMgr
{
    constructor() {
        this['taskList'] = {};
        this['curTask'] = null;
        this['progress'] = 0;
    }

    makeTask(taskName) {
        if (this['taskList'][taskName]) { return; }
        this['taskList'][taskName] = {
            'items': [],
            'completion': ""
        };
    }

    makeTasks(taskNames) {
        for (var i = 0; i < taskNames.length; ++i) {
            this.makeTask(taskNames[i]);
        }
    }

    addItem(taskName, item) {
        if (!this['taskList'][taskName]) { return; }
        this['taskList'][taskName]['items'].push(item);
    }

    addItems(taskName, items) {
        for (var i = 0; i < items.length; ++i) {
            this.addItem(taskName, items[i]);
        }
    }

    setCompletionString(taskName, str) {
        if (!this['taskList'][taskName]) { return; }
        this['taskList'][taskName]['completion'] = str;
    }

    setTask(taskName) {
        if (!this['taskList'][taskName]) { return; }
        this['curTask'] = taskName;
        this['progress'] = 0;
    }

    getTaskItemTotal() {
        let curTask = this['curTask'];
        let taskList = this['taskList'];
        let progress = this['progress'];

        if (!taskList[curTask]) { return -1; }
        return taskList[curTask]['items'].length;
    }

    advanceProgress() {
        let curTask = this['curTask'];
        let taskList = this['taskList'];

        if (!taskList[curTask]) { return; }
        if (taskList[curTask]['items'].length < this['progress']) { return; }
        ++this['progress'];
    }

    getCurTaskItem() {
        let curTask = this['curTask'];
        let taskList = this['taskList'];
        let progress = this['progress'];

        if (!taskList[curTask]) { return null; }
        if (taskList[curTask]['items'].length < this['progrees']) { return null; }
        return taskList[curTask]['items'][progress];
    }

    getCurTaskProgress() {
        return this['progress'] + 1;
    }

    getCurTaskProgressRate() {
        let curTask = this['curTask'];
        let taskList = this['taskList'];
        let progress = this['progress'];

        if (!taskList[curTask]) { return 0.0; }
        if (taskList[curTask]['items'].length < progress) { return 0.0; }
        return (progress + 1) * 1.0 / taskList[curTask]['items'].length;
    }

    genProgressString() {
        let curTask = this['curTask'];
        let taskList = this['taskList'];

        if (!taskList[curTask]) { return ""; }
        if (this.taskInProgress(curTask)) {
            return this.getCurTaskItem() + " (" + this.getCurTaskProgress() + "/" + this.getTaskItemTotal() + ")";
        }
        else if (this.taskCompleted(curTask)) {
            return taskList[curTask]['completion'];
        }

        return "";
    }

    taskInProgress(taskName) {
        let curTask = this['curTask'];
        let taskList = this['taskList'];
        let progress = this['progress'];

        return taskList[curTask]['items'].length > progress;
    }

    taskCompleted(taskName) {
        let curTask = this['curTask'];
        let taskList = this['taskList'];
        let progress = this['progress'];

        return taskList[curTask]['items'].length == progress;
    }

}
