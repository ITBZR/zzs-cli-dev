/*
 * @Descripttion: 
 * @Author: BZR
 * @Date: 2022-08-22 16:31:54
 * @LastEditTime: 2022-08-24 17:49:12
 */
'use strict';

const Command = require('@zzs-cli-dev/command')
const log = require('@zzs-cli-dev/log')

class InitCommand extends Command {
    init () {
        this.projectName = this._argv[0] || ''
        this.force = !!this._cmd.opts.force
        log.verbose('projectName', this.projectName)
        log.verbose('force', this.force)
    }
    exec () {
        console.log('exec initCommand')
    }
}

function init(argv) {
    return new InitCommand(argv)
}

module.exports = init;
