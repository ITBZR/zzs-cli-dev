/*
 * @Descripttion: 
 * @Author: BZR
 * @Date: 2022-08-23 09:33:00
 * @LastEditTime: 2022-08-23 17:25:16
 */
'use strict';
const path = require('path')
const Package = require('@zzs-cli-dev/package')
const log = require('@zzs-cli-dev/log')

const SETTINGS = {
    init: '@zzs-cli-dev/init',
    // init: '@imooc-cli/init',
}
const CACHE_DIR = 'dependencies'

async function exec() {
    let targetPath = process.env.CLI_TARGET_PATH
    const homePath = process.env.CLI_HOME_PATH
    let storePath = ''
    log.verbose('targetPath', targetPath)
    log.verbose('homePath', homePath)
    
    const cmdObj = arguments[arguments.length - 1]
    const cmdName = cmdObj.name()
    const packageName = SETTINGS[cmdName]
    const packageVersion = 'latest'
    let pkg
    
    // 如果没有指定目标目录 设置为缓存目录
    if (!targetPath) {
        targetPath = path.resolve(homePath, CACHE_DIR) // 生成缓存路径
        storePath = path.resolve(targetPath, 'node_modules')
        log.verbose('targetPath: ', targetPath)
        log.verbose('storeDir: ', storePath)

        pkg = new Package({
            packageName,
            packageVersion,
            targetPath,
            storePath
        })
    
        if (await pkg.exists()) {
            // 更新package
            console.log('更新')
        } else {
            console.log('安装')
            // 安装package
            await pkg.install()
        }
    
        
    } else {
        pkg = new Package({
            packageName,
            packageVersion,
            targetPath,
            storePath
        })
    }
    const rootFile = pkg.getRootFilePath()
    if (rootFile) {
        require(rootFile)()
    }
}

module.exports = exec;