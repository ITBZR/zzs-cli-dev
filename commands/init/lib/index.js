/*
 * @Descripttion: 
 * @Author: BZR
 * @Date: 2022-08-22 16:31:54
 * @LastEditTime: 2022-08-31 17:36:07
 */
'use strict';
const fs = require('fs')
const path = require('path')
const fse = require('fs-extra')
const inquirer = require('inquirer')
const semver = require('semver')
const userHome = require('user-home')
const ejs = require('ejs')
const Command = require('@zzs-cli-dev/command')
const Package = require('@zzs-cli-dev/package')
const utils = require('@zzs-cli-dev/utils')
const log = require('@zzs-cli-dev/log');
const { type } = require('os');
const getProjectTemplate = require('./getProjectTemplate')

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'

const TEMPLATE_TYPE_NORMAL = 'normal'
const TEMPLATE_TYPE_CUSTOM = 'custom'

const WHITE_COMMAND = ['npm', 'cnpm', 'yarn']

class InitCommand extends Command {
    init () {
        this.projectName = this._argv[0] || ''
        this.force = !!this._cmd.opts.force
        log.verbose('projectName', this.projectName)
        log.verbose('force', this.force)
    }
    async exec () {
        try {
            // 1.准备阶段
            const projectInfo = await this.prepare()
            if (projectInfo) {
                // 2.下载模板
                log.verbose('projectInfo', projectInfo)
                this.projectInfo = projectInfo
                await this.downloadTemplate()
                // 3.安装模板
                await this.installTemplate()
            }
        } catch (error) {
            log.error(error.message)
        }
    }

    // 安装模板
    async installTemplate() {
        if (this.templateInfo) {
            if (!this.templateInfo.type) {
                this.templateInfo.type = TEMPLATE_TYPE_NORMAL
            }
            if (this.templateInfo.type === TEMPLATE_TYPE_NORMAL) {
                await this.installNormalTemplate()
                // 标准安装
                return
            }
            if (this.templateInfo.type === TEMPLATE_TYPE_CUSTOM) {
                log.verbose('自定义安装')
                // 自定义安装
                return
            }
            throw new Error('不能识别的模板类型！')
        }
        throw new Error('项目模板信息不存在！')
    }

    // 命令白名单验证
    checkCommand(cmd) {
        if (WHITE_COMMAND.includes(cmd)) {
            return cmd
        }
        return null
    }

    async execCommand (command, msg = '命令执行失败') {
        if (command) {
            const cmdList = command.split(' ')
            const cmd = this.checkCommand(cmdList[0])
            if (!cmd) {
                throw new Error(`命令${command}不存在，或被禁止使用`)
            }
            const args = cmdList.slice(1)
            const ret = await utils.execAsync(cmd, args, {
                stdio: 'inherit',
                cwd: process.cwd()
            })
            if (ret !== 0) {
                throw new Error(msg)
            }
            return ret
        }
    }

    async installNormalTemplate() {
        log.verbose('安装标准模板')
        // 0.拷贝模板到当前目录
        const spinner = utils.spinnerStart('正在安装模板...')
        try {
            const templatePath = path.resolve(this.templateNpm.cacheFilePath, 'template')
            const targetPath = process.cwd()
            fse.ensureDirSync(templatePath)
            fse.ensureDirSync(targetPath)
            fse.copySync(templatePath, targetPath)
            spinner.stop(true)
            log.success('模板安装完成')
        } catch (error) {
            spinner.stop(true)
            throw error
        }
        // 1.模板渲染
        const ignore = ['noode_modules/**']
        await this.ejsRender({ignore})
        // 2.依赖安装
        const { startCommand, installCommand } = this.templateInfo
        await this.execCommand(installCommand, '依赖安装失败')
        // 3.命令启动
        await this.execCommand(startCommand, '启动失败')
    }

    async ejsRender({ ignore = [] }) {
        const dir = process.cwd()
        return new Promise((resolve, reject) => {
            require('glob')('**', {
                cwd: dir,
                ignore,
                nodir: true,
            }, (err, files) => {
                if (err) {
                    reject(err)
                }
                Promise.all(files.map(file => {
                    const filePath = path.join(dir, file)
                    return new Promise((resolve1, reject1) => {
                        ejs.renderFile(filePath, this.projectInfo, {}, (err, ret) => {
                            if (err) {
                                reject1(err)
                            } else {
                                fse.writeFileSync(filePath, ret)
                                resolve1(ret)
                            }
                        })
                    })
                })).then(() => {
                    resolve()
                }).catch(err => {
                    reject(err)
                })
            })
        })
    }

    async installCustomTemplate() {
        log.verbose('安装自定义模板')
    }

    // 下载模板
    async downloadTemplate() {
        // 1.通过项目模板API获取模板信息
        // 2.通过egg.js搭建一套后端系统
        // 3.通过npm存储项目模板
        // 4.将项目模板信息存储到mongodb数据库中
        // 5.通过egg.js获取mongodb中的数据并通过API返回

        // 1.根据选择获取项目模板信息
        const { projectTemplate } = this.projectInfo
        const templateInfo = this.template.find((v) => v.npmName === projectTemplate)
        this.templateInfo = templateInfo
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
        this.templateNpm = templateNpm
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
        function validateProjectName(name) {
            return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(name)
        }
        let projectInfo = {}
        if (type === TYPE_PROJECT) {
            const promptList = [
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
            ]
            const projectNamePrompt = {
                type: 'input',
                name: 'projectName',
                message: '请输入项目名称',
                default: '',
                validate: function (name) {
                    const done = this.async()
                    setTimeout(function () {
                        if (!validateProjectName(name)) {
                            done('请输入合法的项目名称')
                            return
                        }
                        done(null, true)
                    }, 0)
                },
                filter: function (name) {
                    return name
                }
            }
            if (!validateProjectName(this.projectName)) {
                promptList.unshift(projectNamePrompt)
            } else {
                projectInfo.name = this.projectName
            }
            // 4.获取项目的基本信息
            const info = await inquirer.prompt(promptList)
            projectInfo = {
                ...projectInfo,
                type,
                ...info
            }
        } else {
        }
        if (projectInfo.projectName) {
            // 大驼峰变横线分割
            projectInfo.name = require('kebab-case')(projectInfo.projectName).replace(/^-/, '')
        }
        if (projectInfo.projectVersion) {
            projectInfo.version = projectInfo.projectVersion
        }
        return projectInfo
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
