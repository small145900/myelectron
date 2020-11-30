import { app, BrowserWindow, nativeTheme, ipcMain } from 'electron'

import { autoUpdater } from 'electron-updater'
const os = require('os');
const path = require('path');
const log = require('electron-log')
const packageInfo = require('../../package.json');

// log.transports.file.level = false
// log.transports.console.level = false
// log.transports.file.file=""

const isMac = process.platform === 'darwin'
const uploadUrl = 'http://127.0.0.1:4000/download/' // 更新服务器地址

try {
  if (process.platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    require('fs').unlinkSync(require('path').join(app.getPath('userData'), 'DevTools Extensions'))
  }
} catch (_) { }

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  global.__statics = __dirname
}

let mainWindow

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    useContentSize: true,
    webPreferences: {
      // Change from /quasar.conf.js > electron > nodeIntegration;
      // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
      nodeIntegration: process.env.QUASAR_NODE_INTEGRATION,
      nodeIntegrationInWorker: process.env.QUASAR_NODE_INTEGRATION,

      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      // preload: path.resolve(__dirname, 'electron-preload.js')
    }
  })

  mainWindow.loadURL(process.env.APP_URL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('version', packageInfo.version)
    updateHandle();
  })

}

// 检测更新，在你想要检查更新的时候执行，renderer事件触发后的操作自行编写
function updateHandle() {
  let message = {
    error: '检查更新出错',
    checking: '正在检查更新……',
    updateAva: '检测到新版本，正在下载……',
    updateNotAva: '现在使用的就是最新版本，不用更新'
  };


  if (process.env.NODE_ENV === 'development') {
    // 开发环境增加本地打包后的app-update.yml文件路径
    // autoUpdater.updateConfigPath = path.join(__dirname, '../../dev-app-update.yml')
    // autoUpdater.updateConfigPath = path.join(__dirname, 'Contents/Resources/app-update.yml')
    // autoUpdater.updateConfigPath = path.join(__dirname, 'win-unpacked/resources/app-update.yml')
  }
  
  autoUpdater.setFeedURL(uploadUrl);
  autoUpdater.on('error', function (error) {
    sendUpdateMessage(message.error)
  });
  autoUpdater.on('checking-for-update', function () {
    sendUpdateMessage(message.checking)
  });
  autoUpdater.on('update-available', function (info) {
    sendUpdateMessage(message.updateAva)
  });
  autoUpdater.on('update-not-available', function (info) {
    sendUpdateMessage(message.updateNotAva)
  });

  // 更新下载进度事件
  autoUpdater.on('download-progress', function (progressObj) {
    mainWindow.webContents.send('downloadProgress', progressObj)
  })
  autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
    ipcMain.on('isUpdateNow', (e, arg) => {
    //   console.log(arguments);
    //   console.log("开始更新");
      //some code here to handle event
      autoUpdater.quitAndInstall();
    });

    mainWindow.webContents.send('isUpdateNow')
  });

  // ipcMain.on("checkForUpdate",() => {
      //执行自动更新检查
      autoUpdater.checkForUpdates();
  // })
}


// 通过main进程发送事件给renderer进程，提示更新信息
function sendUpdateMessage(text) { 
  mainWindow.webContents.send('message', text)
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
