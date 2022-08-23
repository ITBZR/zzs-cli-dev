/*
 * @Descripttion: 
 * @Author: BZR
 * @Date: 2022-08-18 11:23:36
 * @LastEditTime: 2022-08-23 10:52:07
 */
'use strict';

function isObject (o) {
    return Object.prototype.toString.call(o) === '[object Object]'
}

module.exports = {
    isObject
}