/*
 * @Descripttion: 
 * @Author: BZR
 * @Date: 2022-08-18 11:03:00
 * @LastEditTime: 2022-08-22 17:46:44
 */
'use strict';

const path = require('path')
const userHome = require('user-home') // 获取用户主目录
const pathExists = require('path-exists').sync // 检查文件是否存在
const semver = require('semver') // 对比版本号
const commander = require('commander')
const colors = require('colors')
const log = require('@zzs-cli-dev/log')
const pkg = require('../package.json')
const constant = require('./const')
const { getNpmSemverVersions } = require('@zzs-cli-dev/get-npm-info')
const init = require('@zzs-cli-dev/init')
module.exports = core;
module.exports.checkPkgVersion = checkPkgVersion;


async function core() {
    console.log('core模块生效, 命令成功执行...');
    try {
        await prepare()
        registerCommand()
    } catch (error) {
        console.error(error.message)
    }
}
const program = new commander.Command()

// 注册命令
function registerCommand () {
    program
        .name(Object.keys(pkg.bin)[0])
        .usage('<command> [options]')
        .version(pkg.version)
        .option('-d, --debug', '是否开始调试模式', false)
        .option('-tp, --targetPath <targetPath>', '指定本地调试文件路径', '')

    // 命令注册
    program
        .command('init [projectName]')
        .option('-f, --force', '是否强制初始化项目')
        .action(init)

    // 实现debug模式
    program.on('option:debug', function () {
        process.env.LOG_LEVEL = 'verbose'
        log.level = process.env.LOG_LEVEL
        log.verbose('test')
    })

    // 监听路径指定
    program.on('option:targetPath', function () {
        const target = this.opts().targetPath
        process.env.CLI_TARGET_PATH = target
    })

    // 实现指定变量缓存
    program.on('option:debug', function () {
        process.env.LOG_LEVEL = 'verbose'
        log.level = process.env.LOG_LEVEL
        log.verbose('test')
    })

    // 全局命令捕获
    program.on('command:*', function (obj) {
        // 未知命令捕获
        const availableCommands = program.commands.map((cmd) => cmd.name())
        console.log(colors.red(`未知命令：${obj[0]}`))

        // 可用命令提示
        if (availableCommands.length) {
            console.log(colors.blue(`可用命令${availableCommands.join(', ')}`))
        }

        // 弹出帮助文档
        program.outputHelp()
        console.log()
    })


    program.parse(process.argv)
}

// 脚手架预备检测
async function prepare () {
    chechUserHome()
    checkRoot()
    checkPkgVersion()
    checkNodeVersion()
    checkEnv()
    await checkGlobalUpdate()
}

// 检测npm版本
async function checkGlobalUpdate () {
    // 1.获取当前的版本号和模块名
    const currentVersion = pkg.version
    const npmName = pkg.name
    // 2.调用npmApi获取所有的版本号
    const lastVersion = await getNpmSemverVersions(currentVersion, pkg.name)
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
