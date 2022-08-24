/*
 * @Descripttion: 
 * @Author: BZR
 * @Date: 2022-08-24 16:08:53
 * @LastEditTime: 2022-08-24 17:49:46
 */
'use strict';
const semver = require('semver')
const colors = require('colors')
const log = require('@zzs-cli-dev/log')
const LOWEST_NODE_VERSION = '12.0.0'
class Command {
    constructor (argv) {
        console.log('Command construtor', argv)
        if (!argv) {
            throw new Error('参数不能为空')
        }
        if (!Array.isArray(argv)) {
            throw new Error('参数只能是数组')
        }
        this._argv = argv
        let runner = new Promise((resolve, reject) => {
            let chain = Promise.resolve()
            chain = chain.then(() => this.checkNodeVersion())
            chain = chain.then(() => this.initArgs())
            chain = chain.then(() => this.init())
            chain = chain.then(() => this.exec())
            chain.catch(err => {
                log.error(err.message)
            })
        })
    }

    init () {
        throw new Error('init必须实现')
    }

    exec() {
        throw new Error('exec必须实现')
    }

    initArgs() {
        this._cmd = this._argv[this._argv.length - 1]
        this._argv = this._argv.slice(0, this._argv.length - 1)
    }

    // 获取最低node版本
    checkNodeVersion () {
        const currentNodeVersion = process.version
        const lowestNodeVersion = LOWEST_NODE_VERSION
        if (!semver.gte(currentNodeVersion, lowestNodeVersion)) {
            throw new Error(colors.red(`zzs-cli 需要安装  ${currentNodeVersion}以上版本的Node`))
        }
    }
}
module.exports = Command;
