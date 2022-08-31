/*
 * @Descripttion: 
 * @Author: BZR
 * @Date: 2022-08-22 16:31:54
 * @LastEditTime: 2022-08-30 11:11:19
 */
'use strict';
const fs = require('fs')
const path = require('path')
const fse = require('fs-extra')
const inquirer = require('inquirer')
const semver = require('semver')
const userHome = require('user-home')
const Command = require('@zzs-cli-dev/command')
const Package = require('@zzs-cli-dev/package')
const utils = require('@zzs-cli-dev/utils')
const log = require('@zzs-cli-dev/log');
const { type } = require('os');
const getProjectTemplate = require('./getProjectTemplate')
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
        try {
            const projectInfo = await this.prepare()
            if (projectInfo) {
                log.verbose('projectInfo', projectInfo)
                this.projectInfo = projectInfo
                // 根据项目信息下载模板
                await this.downloadTemplate()
            }
        } catch (error) {
            log.error(error.message)
        }
    }

    async downloadTemplate() {
        // 1.通过项目模板API获取模板信息
        // 2.通过egg.js搭建一套后端系统
        // 3.通过npm存储项目模板
        // 4.将项目模板信息存储到mongodb数据库中
        // 5.通过egg.js获取mongodb中的数据并通过API返回

        // 1.根据选择获取项目模板信息
        const { projectTemplate } = this.projectInfo
        const templateInfo = this.template.find((v) => v.npmName === projectTemplate)
        // 2.获取用户目录和缓存目录
        const targetPath = path.resolve(userHome, '.zzs-cli-dev', 'template')
        const storePath = path.resolve(userHome, '.zzs-cli-dev', 'template', 'node_modules')
        // 3.生成package类
        const templateNpm = new Package({
            targetPath,
            storePath,
            packageName: templateInfo.npmName,
            packageVersion: templateInfo.version
        })
        if (await templateNpm.exists()) {
            log.verbose('当前目录存在， 更新项目')
            const spinner = utils.spinnerStart('玩命更新中...')
            try {
                await templateNpm.update()
                log.success('模板更新完成')
            } catch (error) {
                throw error
            } finally {
                spinner.stop(true)
            }
        } else {
            log.verbose('当前目录不存在, 下载项目')
            const spinner = utils.spinnerStart('玩命下载中...')
            try {
                await templateNpm.install()
                log.success('模板下载完成')
            } catch (error) {
                throw error
            } finally {
                spinner.stop(true)
            }
        }
    }

    async prepare() {
        // 0.判断项目模板是否存在
        this.template = await getProjectTemplate()
        if (!this.template || !this.template.length) {
            throw new Error('没有项目模板，无法完成初始化')
        }
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
        const info = await this.getProjectInfo()
        return info
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
                    default: '1.0.0',
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
                {
                    type: 'list',
                    name: 'projectTemplate',
                    message: '请选择项目模板',
                    choices: this.createTemplateChoice()
                }
            ])
            const projectInfo = {
                type,
                ...info
            }
            return projectInfo
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

    // 项目模板列表
    createTemplateChoice() {
        return this.template.map((project) => ({
            name: project.name,
            value: project.npmName
        }))
    }
}

function init(argv) {
    return new InitCommand(argv)
}

module.exports = init;
