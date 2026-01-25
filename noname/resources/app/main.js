const {app, BrowserWindow, globalShortcut} = require('electron');
const fs = require('fs');
const path = require('path');

let windows = []; // 存储所有窗口数组
let autoWinMaximize = true;
// 注册全局快捷键
function registerShortcuts(win) {
	// 按下Esc键退出全屏
	globalShortcut.register('ESC', () => {
		if (!win.isDestroyed()) {
			// 临时修复Electron中使用alert和comfirm等弹窗后input无法获得焦点的bug
			// 临时修复方案：非全屏下按下Esc键
			if (!win.isFullScreen()) {
				win.minimize();
				win.restore();
			}
			
			if (win.isFullScreen()) {
				win.setFullScreen(false);
				
				// 首次退出全屏后自动最大化
				if (autoWinMaximize) {
					const [width, height] = win.getSize();
					if (width === 800 && height === 600) {
						win.maximize();
						autoWinMaximize = false;
					}
				}
			}
		}
	}, win);
	// 按下F11键进入全屏
	globalShortcut.register('F11', () => {
		if (!win.isDestroyed()) {
			// 临时修复Electron中使用alert和comfirm等弹窗后input无法获得焦点的bug
			// 临时修复方案：全屏下按下F11键
			if (win.isFullScreen()) {
				win.minimize();
				win.restore();
			}
			
			if (!win.isFullScreen()) {
				win.setFullScreen(true);
			}
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
			enableRemoteModule: true,
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

// 应用退出后额外删除【C:\Users\用户名\AppData\Roaming\无名杀】文件夹，做到应用删除无残留
// 要删除的目标路径
let roamingDirPath;
roamingDirPath = path.join(process.env.APPDATA, app.getName());
// 定义递归删除目录的函数
function deleteDirectory(dirPath) {
	try {
		if (fs.existsSync(dirPath)) {
			// 遍历删除文件和子目录
			fs.readdirSync(dirPath).forEach(file => {
				const filePath = path.join(dirPath, file);
				if (fs.lstatSync(filePath).isDirectory()) {
					deleteDirectory(filePath); // 递归处理子目录
				} else {
					fs.unlinkSync(filePath); // 删除文件
				}
			});
			// 最后删除空目录本身（如果路径合法）
			if (!path.basename(dirPath).includes(':')) { 
				fs.rmdirSync(dirPath);
			}
		}
	} catch (error) {
		console.error(`无法删除目录 ${dirPath}:`, error.message);
	}
}

// 监听应用退出事件
app.on('will-quit', () => {
	// 在退出前尝试删除临时路径
	deleteDirectory(roamingDirPath);

	// 注销所有快捷键
	globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (windows.length === 0) {
		createWindow();
	}
});
