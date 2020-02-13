'use strict'

const { assertSymlink } = require('./_util')
const config = require('./config.json')
const download = require('../src/download')
const path = require('path')
const test = require('ava')
const unzip = require('../src/unzip')

test.serial('unzip preserves symbolic links', async t => {
  const zipPath = await download.downloadElectronZip({
    electronVersion: config.version,
    platform: 'darwin',
    arch: 'x64'
  })

  await unzip(zipPath, t.context.tempDir)

  await assertSymlink(t, path.join(t.context.tempDir, 'Electron.app/Contents/Frameworks/Electron Framework.framework/Libraries'), 'symbolic link extracted correctly')
})
