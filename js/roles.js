/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	yahoo: ['dom'],
	mod:[{name: 'user', files: ['permission.js']}]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		L = YAHOO.lang,
		NS = this.namespace;

	var load = false;

	NS.roles = {};
	
	NS.roles.load = function(callback){
		Brick.Permission.load(function(){
			NS.roles['isAdmin'] = Brick.Permission.check('calendar', '50') == 1;
			NS.roles['isWrite'] = Brick.Permission.check('calendar', '30') == 1;
			callback();
		});
	};		

};