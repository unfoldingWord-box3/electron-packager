'use strict'

const common = require('./common')
const debug = require('debug')('electronite-packager')
const { downloadArtifact } = require('@electron/get')
const semver = require('semver')
const targets = require('./targets')

function createDownloadOpts (opts, platform, arch) {
  const downloadOpts = { ...opts.download }

  common.subOptionWarning(downloadOpts, 'download', 'platform', platform, opts.quiet)
  common.subOptionWarning(downloadOpts, 'download', 'arch', arch, opts.quiet)
  common.subOptionWarning(downloadOpts, 'download', 'version', opts.electronVersion, opts.quiet)
  common.subOptionWarning(downloadOpts, 'download', 'artifactName', 'electron', opts.quiet)

  return downloadOpts
}

module.exports = {
  createDownloadCombos: function createDownloadCombos (opts, selectedPlatforms, selectedArchs, ignoreFunc) {
    return targets.createPlatformArchPairs(opts, selectedPlatforms, selectedArchs, ignoreFunc).map(([platform, arch]) => {
      return createDownloadOpts(opts, platform, arch)
    })
  },
  createDownloadOpts: createDownloadOpts,
  downloadElectronZip: async function downloadElectronZip (downloadOpts) {
    // armv7l builds have only been backfilled for Electron >= 1.0.0.
    // See: https://github.com/electron/electron/pull/6986
    /* istanbul ignore if */
    if (downloadOpts.arch === 'armv7l' && semver.lt(downloadOpts.version, '1.0.0')) {
      downloadOpts.arch = 'arm'
    }
    debug(`Downloading Electron with options ${JSON.stringify(downloadOpts)}`)
    return downloadArtifact({
      // use electronite mirror by default
      unsafelyDisableChecksums: true,
      mirrorOptions: {
        mirror: 'https://github.com/unfoldingWord-dev/electronite/releases/download/',
        customDir: 'v' + downloadOpts.version,
        customFilename: 'electronite-v' + downloadOpts.version + '-' + downloadOpts.platform + '-' + downloadOpts.arch + '.zip'
      },
      ...downloadOpts
    })
  }
}
