/*
 * @Descripttion: 
 * @Author: BZR
 * @Date: 2022-08-23 14:23:15
 * @LastEditTime: 2022-08-23 14:27:33
 */
'use strict';
const path = require('path')

function formatPath(p) {
    if(p && typeof p === "string") {
        const sep = path.sep
        if (sep === '/') {
            return p
        } else {
            return p.replace(/\\/g, '/')
        }
    }
    return p
}

module.exports = formatPath;