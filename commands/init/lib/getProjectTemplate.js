/*
 * @Descripttion: 
 * @Author: BZR
 * @Date: 2022-08-29 14:58:05
 * @LastEditTime: 2022-08-29 15:02:44
 */
const request = require('@zzs-cli-dev/request')

module.exports = function () {
    console.log('123456789456123')
    return request({
        url: '/project/template'
    })
}