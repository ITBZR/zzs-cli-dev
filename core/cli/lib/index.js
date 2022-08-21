/*
 * @Descripttion: 
 * @Author: BZR
 * @Date: 2022-08-18 11:03:00
 * @LastEditTime: 2022-08-19 18:27:36
 */
'use strict';

const path = require('path')
const userHome = require('user-home') // 获取用户主目录
const pathExists = require('path-exists').sync // 检查文件是否存在
const semver = require('semver') // 对比版本号
const colors = require('colors')
const log = require('@zzs-cli-dev/log')
const pkg = require('../package.json')
const constant = require('./const')
const { getNpmSemverVersions } = require('@zzs-cli-dev/get-npm-info')
module.exports = core;
module.exports.checkPkgVersion = checkPkgVersion;


async function core() {
    console.log('core模块生效, 命令成功执行...');
    try {
        chechUserHome()
        checkRoot()
        checkPkgVersion()
        checkNodeVersion()
        checkInputArgs()
        checkEnv()
        await checkGlobalUpdate()
    } catch (error) {
        console.error(error.message)
    }
}
let args

// 检测npm版本
async function checkGlobalUpdate () {
    // 1.获取当前的版本号和模块名
    const currentVersion = pkg.version
    const npmName = pkg.name
    // 2.调用npmApi获取所有的版本号
    const lastVersion = await getNpmSemverVersions(currentVersion, '@imooc-cli/core')
    if (lastVersion && semver.gt(lastVersion, currentVersion)) {
        log.warn(colors.yellow(`
            请手动更新  ${npmName},
            当前版本为: ${currentVersion},
            最新版本为: ${lastVersion},
            更新命令:   npm i -g ${npmName}
        `))
    }
    // 3.提取所有版本号，对比哪些版本号是大于当前版本的
    // 4.获取最新的版本号，提示用户更新到该版本
}

// 获取环境变量
function checkEnv () {
    const dotenv = require('dotenv')
    const dotenvPath = path.resolve(userHome, '.env')
    if (pathExists(dotenvPath)) {
        dotenv.config({
            path: dotenvPath
        })
    }
    createDefaultConfig()
}

// 创建模式环境变量配置
function createDefaultConfig () {
    const cliConfig = {
        home: userHome
    }
    if (process.env.CLI_HOME) {
        cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
    } else {
        cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME)
    }
    process.env.CLI_HOME_PATH = cliConfig.cliHome
    return cliConfig
}

// 获取输入的命令
function checkInputArgs () {
    const minimist = require('minimist')
    args = minimist(process.argv.slice(2))
    checkArgs()
}

// 命令分析
function checkArgs () {
    if (args.debug) {
        process.env.LOG_LEVEL = 'verbose'
    } else {
        process.env.LOG_LEVEL = 'info'
    }
    log.level = 'verbose'
}

// 检查用户主目录
function chechUserHome () {
    if (!userHome || !pathExists(userHome)) {
        throw new Error('用户主目录不存在')
    }
}

// root降级 兼容权限
function checkRoot () {
    const rootCheck = require('root-check') // 账号降级
    rootCheck()
}

// 获取当前cli版本号
function checkPkgVersion () {
    log.notice('cli', pkg.version)
}

// 获取最低node版本
function checkNodeVersion () {
    const currentNodeVersion = process.version
    const lowestNodeVersion = constant.LOWEST_NODE_VERSION
    if (!semver.gte(currentNodeVersion, lowestNodeVersion)) {
        throw new Error(colors.red(`zzs-cli 需要安装  ${currentNodeVersion}以上版本的Node`))
    }
}
