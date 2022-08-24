/*
 * @Descripttion: 
 * @Author: BZR
 * @Date: 2022-08-22 08:59:50
 * @LastEditTime: 2022-08-24 10:15:15
 */
'use strict';
const axios = require('axios')
const urlJoin = require('url-join')
const semver = require('semver')


function getNpmInfo(baseVersion, npmName, registry) {
    if (!npmName) {
        return null
    }
    const registryUrl = registry || getDefaultRegistry()
    const npmInfoUrl = urlJoin(registryUrl, npmName)
    return axios.get(npmInfoUrl).then((res) => {
        if (res.status === 200) return res
        return null
    }).catch((e) => {
        return Promise.reject(e)
    })
}

function getDefaultRegistry (isOriginal = false) {
    return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org'
}

async function getNpmVersions (baseVersion, npmName) {
    const { data } = await getNpmInfo(baseVersion, npmName)
    if (data && data.versions) return Object.keys(data.versions)
    return []
}

function getSemverVersions(baseVersion, versions) {
    return versions.filter((version) => semver.satisfies(version, `^${baseVersion}`))
}

async function getNpmSemverVersions(baseVersion, npmName) {
    const versions = await getNpmVersions(baseVersion, npmName)
    const newVersions = getSemverVersions(baseVersion, versions)
    if (newVersions && newVersions.length) return newVersions[newVersions.length - 1]
}

async function getNpmLatestVersion (baseVersion, npmName) {
    const versions = await getNpmVersions(baseVersion, npmName)
    if (versions && versions.length) {
        return versions[versions.length - 1]
    }
    return null
}

module.exports = {
    getNpmSemverVersions,
    getDefaultRegistry,
    getNpmLatestVersion
};