/*
 * @Descripttion: 
 * @Author: BZR
 * @Date: 2022-08-18 11:23:36
 * @LastEditTime: 2022-08-30 10:42:16
 */
'use strict';

function isObject (o) {
    return Object.prototype.toString.call(o) === '[object Object]'
}

function spinnerStart(text='loading...', gifStr = '|/-\\') {
    const Spinner = require('cli-spinner').Spinner
    const spinner = new Spinner(`${text} %s`)
    spinner.setSpinnerString(gifStr)
    spinner.start()
    return spinner
}

module.exports = {
    isObject,
    spinnerStart
}