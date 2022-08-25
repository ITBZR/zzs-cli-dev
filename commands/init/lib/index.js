/*
 * @Descripttion: 
 * @Author: BZR
 * @Date: 2022-08-22 16:31:54
 * @LastEditTime: 2022-08-25 17:56:55
 */
'use strict';
const fs = require('fs')
const fse = require('fs-extra')
const inquirer = require('inquirer')
const semver = require('semver')
const Command = require('@zzs-cli-dev/command')
const log = require('@zzs-cli-dev/log');
const { type } = require('os');

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'

class InitCommand extends Command {
    init () {
        this.projectName = this._argv[0] || ''
        this.force = !!this._cmd.opts.force
        log.verbose('projectName', this.projectName)
        log.verbose('force', this.force)
    }
    async exec () {
        await this.prepare()
    }

    async prepare() {
        const localPath = process.cwd()
        // 1.判断当前目录是否为空
        if (!this.isCwdEmpty()) {
            // 1.1 文件不为空，是否强制更新
            if (!this.force) {
                const { isContinue } = await inquirer.prompt({
                    type: 'confirm',
                    name: 'isContinue',
                    default: false,
                    message: '当前文件夹不为空，是否继续创建项目？'
                })
                if (!isContinue) return false
            }
            const { isRemove } = await inquirer.prompt({
                type: 'confirm',
                name: 'isRemove',
                default: false,
                message: '是否清空当前文件夹？'
            })
            // 2.是否启动强制更新
            if (isRemove) {
                fse.emptyDirSync(localPath)
            }
        }
        await this.getProjectInfo()
        
    }

    async getProjectInfo() {
        // 3.选择创建项目或组件
        const { type } = await inquirer.prompt({
            type: 'list',
            name: 'type',
            message: '请选择初始化类型',
            default: TYPE_PROJECT,
            choices: [
                {
                    name: '项目',
                    value: TYPE_PROJECT
                },
                {
                    name: '组件',
                    value: TYPE_COMPONENT
                }
            ]
        })
        if (type === TYPE_PROJECT) {
            // 4.获取项目的基本信息
            const info = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'projectName',
                    message: '请输入项目名称',
                    default: '',
                    validate: function (name) {
                        const done = this.async()
                        setTimeout(function () {
                            if (!/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(name)) {
                                done('请输入合法的项目名称')
                                return
                            }
                            done(null, true)
                        }, 0)
                    },
                    filter: function (name) {
                        return name
                    }
                },
                {
                    type: 'input',
                    name: 'projectVersion',
                    message: '请输入项目版本号',
                    default: '',
                    validate: function (version) {
                        const done = this.async()
                        setTimeout(function () {
                            if (!semver.valid(version)) {
                                done('请输入合法的项目版本号')
                                return
                            }
                            done(null, true)
                        }, 0)
                    },
                    filter: function (version) {
                        return version
                    }
                },
            ])
            console.log(info)
        } else {
        }
    }
    
    // 判断目录是否为空
    isCwdEmpty() {
        // 获取文件当前路径
        const localPath = process.cwd()
        let fileList = fs.readdirSync(localPath)
        fileList = fileList.filter((fileName) => {
            return !fileName.startsWith('.') && fileName !== 'node_modules'
        })
        return !fileList || !fileList.length
    }
}

function init(argv) {
    return new InitCommand(argv)
}

module.exports = init;
