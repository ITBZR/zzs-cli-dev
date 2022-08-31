/*
 * @Descripttion: 
 * @Author: BZR
 * @Date: 2022-08-29 14:48:46
 * @LastEditTime: 2022-08-29 15:34:54
 */
'use strict';
const axios = require('axios')

const BASE_URL = process.env.ZZS_CLI_BASE_URL ? process.env.ZZS_CLI_BASE_URL : 'http://127.0.0.1:7001'

const request = axios.create({
    baseURL: BASE_URL,
    timeout: 5000,
})

request.interceptors.response.use(res => {
    return res.data
}, err => {
    return Promise.reject(err)
})

module.exports = request;
