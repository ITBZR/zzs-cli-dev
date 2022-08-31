/*
 * @Descripttion: 
 * @Author: BZR
 * @Date: 2022-08-18 11:23:36
 * @LastEditTime: 2022-08-31 14:33:14
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

// window mac兼容
function exec (command, args, options) {
    const win32 = process.platform === 'win32'
    
    const cmd = win32 ? 'cmd' : command

    const cmdArgs = win32 ? ['/c'].concat(command, args) : args
    return require('child_process').spawn(cmd, cmdArgs, options || {})
}

// window mac兼容
function exec (command, args, options) {
    const win32 = process.platform === 'win32'
    
    const cmd = win32 ? 'cmd' : command

    const cmdArgs = win32 ? ['/c'].concat(command, args) : args
    return require('child_process').spawn(cmd, cmdArgs, options || {})
}

function execAsync (command, args, options) {
    return new Promise((resolve, reject) => {
        const p = exec(command, args, options)
        p.on('exit', (c) => {
            resolve(c)
        })
        p.on('error', e => {
            reject(e)
        })
    })
}

module.exports = {
    isObject,
    spinnerStart,
    execAsync,
}