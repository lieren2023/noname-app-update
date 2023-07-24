'use strict';
(function() {
	var url = localStorage.getItem('noname_inited');
	var loadFailed = function() {
		localStorage.removeItem('noname_inited');
		window.location.reload();
	}
	var loadFailed2 = function() {
		localStorage.removeItem('noname_inited');
	}
	var load = function(src, onload, onerror) {
		var script = document.createElement('script');
		script.src = 'game/' + src + '.js';
		script.onload = onload;
		script.onerror = function() {
			alert('请看教程安装无名杀本体');
			onerror();
		};
		document.head.appendChild(script);
	}
	var fail = url ? loadFailed : loadFailed2;
	load('update', function() {
		load('config', function() {
			load('package', function() {
				load('game', function() {
					if (!localStorage.getItem('noname_inited')) {
						localStorage.setItem('noname_inited', 'nodejs');
						window.location.reload();
					}
				}, fail);
			},fail);
		},fail);
	},fail);
}());