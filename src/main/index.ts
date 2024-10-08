import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import path, { join } from 'path'
import fs from 'fs'
import os from 'os'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    title: '配置文件编辑器',
    width: 800,
    height: 600,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // 设置为 true，则你可以在网页中使用 Node.js 的 API，例如 require 方法来引入 Node.js 的模块
      nodeIntegration: true,
      // 设置为 true，那么 Electron 主进程和渲染进程的 JavaScript 上下文将被隔离，
      // 这意味着在主进程中定义的全局变量、函数等将无法在渲染进程中访问，反之亦然。
      contextIsolation: false,
      webSecurity: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    mainWindow.webContents.openDevTools()
  }

  ipcMain.handle('open-select-dialog', async (_, arg) => {
    const openDialogReturnValue = await dialog.showOpenDialog(mainWindow, {
      title: '选择配置文件',
      properties: ['openFile', 'multiSelections']
    })
    const filePaths = openDialogReturnValue.filePaths
    if (filePaths && filePaths.length > 0) {
      return { filePaths }
    } else {
      return { filePaths: [] }
    }
  })
  // 获取txt文件的内容
  ipcMain.handle('read-file-content', (_, arg) => {
    let code = 0;
    let msg: any;
    let res: string | undefined = undefined
    let {  filePath } = arg ?? {};
    const homeDirectory = os.homedir();
    console.log('文件路径kk:', filePath);
    if (filePath) {
      if (String(filePath).startsWith('~')) {
        // 将 ~ 替换为 homeDirectory
        filePath = String(filePath).replace(/^~/, homeDirectory)
      }
      console.log('文件路径:', filePath);
      try {
        fs.accessSync(filePath, fs.constants.F_OK);
        fs.accessSync(filePath, fs.constants.R_OK);
        const data = fs.readFileSync(filePath, 'utf8');
        res = data;
        code = 3;
        msg = '读取文件成功'
        console.log('文件内容:', data);
      } catch (err) {
        code = 2;
        msg = '读取文件出错'
        console.error('读取文件出错:', err);
      }
    } else {
      code = 1;
      msg = '文件路径不存在'
    }
    return { content: res, code, msg }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.xopenbeta.configeditor')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
