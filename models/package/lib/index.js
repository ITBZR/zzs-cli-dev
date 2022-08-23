/*
 * @Descripttion: 
 * @Author: BZR
 * @Date: 2022-08-23 10:13:34
 * @LastEditTime: 2022-08-23 17:28:14
 */
'use strict';

const path = require('path')
const pkgDir = require('pkg-dir').sync
const npminstall = require('npminstall')
const pathExists = require('path-exists')
const { isObject } = require('@zzs-cli-dev/utils')
const formatPath = require('@zzs-cli-dev/format-path')
const { getDefaultRegistry, getNpmLatestVersions } = require('@zzs-cli-dev/get-npm-info')
class Package {
    constructor(options = {
        targetPath: '',
        storePath: '',
        packageName: '',
        packageVersion: ''
    }) {
        if (!isObject(options)) {
            throw new Error('options参数必须为Object类型')
        }
        // if (!options.packageName.length) {
        //     throw new Error('packageName参数名称不能为空')
        // }
        // package的路径
        this.targetPath = options.targetPath
        // package的缓存路径
        this.storePath = options.storePath
        // package的名称
        this.packageName = options.packageName
        // package的版本号
        this.packageVersion = options.packageVersion
        // package的缓存目录前缀
        this.cacheFilePathPrefix = this.packageName.replace('/', '_')
    }

    async prepare () {
        if (this.packageVersion === 'latest') {
            this.packageVersion = await getNpmLatestVersions(this.packageVersion, this.packageName)
        }
    }

    // 判断当前package是否存在
    async exists () {
        if (this.storePath) {
            await this.prepare()
            return pathExists(this.cacheFilePath)
        } else {
            return await pathExists(this.targetPath)
        }
    }

    // 缓存路径拼接
    get cacheFilePath () {
        return path.resolve(this.storePath, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
    }

    // 下载package
    install () {
        return npminstall({
            root: this.targetPath,
            storeDir: this.storePath,
            registry: getDefaultRegistry(),
            pkgs: [
                {
                    name: this.packageName, version: this.packageVersion
                }
            ]
        })
    }

    // 更新package
    update () {}

    // 获取入口文件路径
    getRootFilePath () {
        // 1.获取package.json的所在目录
        const dir = pkgDir(this.targetPath)
        if (dir) {
            // 2.读取package.json
            const pkgFile = require(path.resolve(dir, 'package.json'))
            // 3.寻找main/lib
            if (pkgFile && pkgFile.main) {
                // 4.路径的兼容(macOS/windows)
                return formatPath(path.resolve(dir, pkgFile.main))
            }
        }
        return null
    }
}


module.exports = Package;
