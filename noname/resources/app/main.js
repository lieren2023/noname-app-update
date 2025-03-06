const {app, BrowserWindow, globalShortcut} = require('electron');
const fs = require('fs');
const path = require('path');

let windows = []; // 存储所有窗口数组
// 注册全局快捷键
function registerShortcuts(win) {
	// 按下Esc键退出全屏
	globalShortcut.register('ESC', () => {
		if (!win.isDestroyed() && win.isFullScreen()) {
			win.setFullScreen(false);
		}
	}, win);
	// 按下F11键进入全屏
	globalShortcut.register('F11', () => {
		if (!win.isDestroyed() && !win.isFullScreen()) {
			win.setFullScreen(true);
		}
	}, win);
}
// 注销全局快捷键
function unregisterShortcuts(win) {
	globalShortcut.unregister('ESC', win);
	globalShortcut.unregister('F11', win);
}

// 更改数据文件存放路径（from 诗笺）
function createDir(dirPath) {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath);
	}
}

function setPath(path1, path2) {
	app.getPath(path1);
	createDir(path2);
	app.setPath(path1, path2);
}

// 将无名杀的数据放到客户端安装包目录中，即游戏目录/UserData内，做到删除后无残留，但会加长写入游戏设置的时间
setPath('userData', path.join(__dirname, 'UserData'));

// 获取单实例锁（from 诗笺）
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
	// 如果获取失败，说明已经有实例在运行了，直接退出
	app.quit();
}

// 无名杀多开代码——一个实例多个窗口（from 诗笺）
// app.on('second-instance', (event, argv) => {
	// createWindow();
// });

function createWindow() {
	// 打开无名杀即开启全屏
	const win = new BrowserWindow({
		fullscreen:true,
		autoHideMenuBar:true, // 设置自动隐藏菜单栏
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		}
	});
	
	// 当窗口失去焦点时注销快捷键
	win.on('blur', () => {
		unregisterShortcuts(win);
	});
	// 当窗口获得焦点时再次注册快捷键
	win.on('focus', () => {
		registerShortcuts(win);
	});
	
	windows.push(win); // 将窗口添加到数组
	
	// 关于背景音消失问题修复（from cocominimum），旧版才需要修复，例如v4.2.12
	// app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
	
	win.loadURL(`file://${__dirname}/app.html`);
	win.on('closed', () => {
		const index = windows.indexOf(win);
		if (index > -1) {
			windows.splice(index, 1); // 移除已关闭的窗口
		}
		unregisterShortcuts(win);
	});
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
	app.quit();
	// 注销所有快捷键
	globalShortcut.unregisterAll();
});

app.on('activate', () => {
	if (windows.length === 0) {
		createWindow();
	}
});
