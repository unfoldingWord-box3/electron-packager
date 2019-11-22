'use strict'

const debug = require('debug')('electron-packager')
const os = require('os')
const { promisify } = require('util')
const { isPlatformMac, warning } = require('./common')
const spawn = require('cross-spawn')
const which = require('which')
const zip = require('cross-zip')

const unzip = promisify(zip.unzip)

async function sevenZipLocation () {
  try {
    return which('7z')
  } catch (err) {
    debug(`Could not find 7z: ${err.message}`)
    return null
  }
}

async function unzipUsing7zip (sevenZip, zipPath, targetDir) {
  let stdout = ''
  let stderr = ''
  const process = spawn(sevenZip, ['x', `-o${targetDir}`, zipPath])
  return new Promise((resolve, reject) => {
    process.stdout.on('data', data => {
      stdout += data
    })
    process.stderr.on('data', data => {
      stderr += data
    })
    process.on('close', code => {
      if (stdout) {
        debug(`STDOUT: ${stdout}`)
      }
      if (stderr) {
        debug(`STDERR: ${stderr}`)
      }
      // According to the man page, exit code 1 is a warning
      if (Number(code) <= 1) {
        resolve()
      } else {
        reject(new Error(`"${sevenZip}" exited with code ${code}. Set the environment variable DEBUG=electron-packager to see 7z stdout/stderr for troubleshooting purposes.`))
      }
    })
  })
}

/**
 * Detects Windows 7 via release number.
 *
 * This also detects Windows Server 2008 R2, but since we're using it to determine whether to check * for Powershell/.NET Framework, it's fine.
 */
function probablyWindows7 () {
  if (process.platform === 'win32') {
    const [majorVersion, minorVersion] = os.release().split('.').map(Number)
    return majorVersion === 6 && minorVersion === 1
  }

  return false
}

module.exports = async function extractElectronZip (targetPlatform, zipPath, targetDir) {
  if (process.platform === 'win32' && isPlatformMac(targetPlatform)) {
    const sevenZip = await sevenZipLocation()
    if (sevenZip) {
      return unzipUsing7zip(sevenZip, zipPath, targetDir)
    } else {
      warning(`Please install 7-zip and add it to your PATH, as the symlinks in the ${targetPlatform} pre-built zip may not be packaged correctly.`)
    }
  }

  if (probablyWindows7()) {
    /* istanbul ignore next */
    warning('Make sure that .NET Framework 4.5 or later and Powershell 3 or later are installed, otherwise extracting the Electron zip file will hang.')
  }

  return unzip(zipPath, targetDir)
}
