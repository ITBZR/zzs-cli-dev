/*
 * @Descripttion: 
 * @Author: BZR
 * @Date: 2022-08-29 14:58:05
 * @LastEditTime: 2022-08-31 14:00:59
 */
const request = require('@zzs-cli-dev/request')

module.exports = function () {
    return request({
        url: '/project/template'
    })
}