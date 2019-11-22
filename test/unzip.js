'use strict'

const config = require('./config.json')
const { createDownloadOpts, downloadElectronZip } = require('../src/download')
const fs = require('fs-extra')
const path = require('path')
const tempy = require('tempy')
const test = require('ava')
const unzip = require('../src/unzip')

test('unzip preserves symbolic links for darwin targets', async t => {
  const downloadOpts = createDownloadOpts({ electronVersion: config.version }, 'darwin', 'x64')
  const zipPath = await downloadElectronZip(downloadOpts)
  const tempPath = tempy.directory()

  try {
    await unzip(downloadOpts.platform, zipPath, tempPath)

    const testSymlinkPath = path.join(tempPath, 'Electron.app/Contents/Frameworks/Electron Framework.framework/Libraries')
    const stat = await fs.lstat(testSymlinkPath)
    t.true(stat.isSymbolicLink(), `Expected "${testSymlinkPath}" to be a symbolic link`)
  } finally {
    await fs.remove(tempPath)
  }
})
