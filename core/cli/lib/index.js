/*
 * @Descripttion: 
 * @Author: BZR
 * @Date: 2022-08-18 11:03:00
 * @LastEditTime: 2022-08-19 18:27:36
 */
'use strict';

const pkg = require('../package.json')
module.exports = core;
module.exports.checkPkgVersion = checkPkgVersion;


function core() {
    console.log('命令执行了');
}

// 版本号
function checkPkgVersion () {
    console.log(pkg.version)
}
