/*
 * @Descripttion: 
 * @Author: BZR
 * @Date: 2022-08-19 18:20:33
 * @LastEditTime: 2022-08-19 18:23:38
 */
'use strict';

const log = require('../lib');
const assert = require('assert').strict;

assert.strictEqual(log(), 'Hello from log');
console.info("log tests passed");
