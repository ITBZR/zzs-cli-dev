/*
 * @Descripttion: 
 * @Author: BZR
 * @Date: 2022-08-23 10:13:34
 * @LastEditTime: 2022-08-31 16:16:13
 */
'use strict';

const path = require('path')
const pkgDir = require('pkg-dir').sync
const npminstall = require('npminstall')
const pathExists = require('path-exists').sync
const fse = require('fs-extra')
const { isObject } = require('@zzs-cli-dev/utils/lib')
const formatPath = require('@zzs-cli-dev/format-path')
const { getDefaultRegistry, getNpmLatestVersion } = require('@zzs-cli-dev/get-npm-info')
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
        // this.packageVersion = '1.1.0'
        // package的缓存目录前缀
        this.cacheFilePathPrefix = this.packageName.replace('/', '_')
    }

    async prepare () {
        // 如果缓存文件不存在， 生成缓存文件
        if (this.storePath && !pathExists(this.storePath)) {
            fse.mkdirpSync(this.storePath)
        }
        if (this.packageVersion === 'latest') {
            this.packageVersion = await getNpmLatestVersion(this.packageVersion, this.packageName)
        }
    }

    // 判断当前package是否存在
    async exists () {
        if (this.storePath) {
            await this.prepare()
            const isExists = await pathExists(this.cacheFilePath)
            return isExists
        } else {
            const isExists = await pathExists(this.targetPath)
            return isExists
        }
    }

    // 缓存路径拼接
    get cacheFilePath () {
        return path.resolve(this.storePath, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
    }

    // 拼接指定版本的缓存路径
    getSpeficCacheFilePath (packageVersion) {
        return path.resolve(this.storePath, `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`)
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
    async update () {
        await this.prepare()
        // 1.获取最新的npm模块版本号
        const latestPackageVersion = await getNpmLatestVersion(this.packageVersion, this.packageName)
        const latestFilePath = this.getSpeficCacheFilePath(latestPackageVersion)
        // 2.查询最新版本号对应的路径是否存在
        if (!pathExists(latestFilePath)) {
            // 3.如果不存在，则直接安装最新版本
            return npminstall({
                root: this.targetPath,
                storeDir: this.storePath,
                registry: getDefaultRegistry(),
                pkgs: [
                    {
                        name: this.packageName,
                        version: latestPackageVersion
                    }
                ]
            })
        }
        this.packageVersion = latestPackageVersion
        console.log(latestPackageVersion, 'latestPackageVersion')
        return latestFilePath
    }

    // 获取入口文件路径
    getRootFilePath () {
        // 1.获取package.json的所在目录
        function _getRootFile (targetpath) {
            const dir = pkgDir(targetpath)  
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
        if (this.storePath) {
            return _getRootFile(this.cacheFilePath)
        } else {
            return _getRootFile(this.targetPath)
        }
    }
}


module.exports = Package;
