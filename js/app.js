/*
@version $Id$
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = { 
	mod:[{name: 'webos', files: ['os.js']}]
};
Component.entryPoint = function(){

	var os = Brick.mod.webos, app;

	if (Brick.Permission.check('calendar', '30') > 0){
		
		app = new os.Application(this.moduleName);
		app.icon = '/modules/calendar/images/app_icon.gif';
		app.entryComponent = 'board';
		app.entryPoint = 'Brick.mod.calendar.API.showBoardPanel';
		
		os.ApplicationManager.register(app);
	}
	
};
