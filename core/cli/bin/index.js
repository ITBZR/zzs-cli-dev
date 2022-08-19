#! /usr/bin/env node

const importLocal = require('import-local')

if (importLocal(__dirname)) {
    // 加载的本地文件
    require('npmlog').info('cli', '正在使用 zzs-cli 本地版本')
} else {
    // 加载的远程文件
    require('../lib')(process.argv.slice(2))
    require('../lib').checkPkgVersion()
}