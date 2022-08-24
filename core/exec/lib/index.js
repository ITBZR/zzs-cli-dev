/*
 * @Descripttion: 
 * @Author: BZR
 * @Date: 2022-08-23 09:33:00
 * @LastEditTime: 2022-08-24 17:55:29
 */
'use strict';
const path = require('path')
const cp = require('child_process')
const Package = require('@zzs-cli-dev/package')
const log = require('@zzs-cli-dev/log')

const SETTINGS = {
    init: '@zzs-cli-dev/utils',
    // init: '@imooc-cli/init',
}
const CACHE_DIR = 'dependencies'

async function exec(argv) {
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
            await pkg.update()
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
        try {
            // 利用多进程执行命令
            // node子进程
            const args = Array.from(arguments)
            const cmd = args[args.length - 1]
            const o = Object.create(null)
            Object.keys(cmd).forEach(key => {
                if (cmd.hasOwnProperty(key) && !key.startsWith('_') && key !== 'parent') {
                    o[key] = cmd[key]
                }
            })
            // 先转换成对象
            o.opts = cmd.opts()

            args[args.length - 1] = o
            const code = `require('${rootFile}')(${JSON.stringify(args)})`
            const child = spawn('node', ['-e', code], {
                cwd: process.cwd(),
                stdio: 'inherit'
            })

            child.on('error', e => {
                log.error(e.message)
                process.exit(1)
            })

            child.on('exit', e => {
                log.verbose('命令执行成功', e)
                process.exit(e)
            })

            // window mac兼容
            function spawn (command, args, options) {
                const win32 = process.platform === 'win32'
                
                const cmd = win32 ? 'cmd' : command

                const cmdArgs = win32 ? ['/c'].concat(command, args) : args
                return cp.spawn(cmd, cmdArgs, options || {})
            }

            
        } catch (error) {
            console.error(error.message)
        }
    }
}

module.exports = exec;