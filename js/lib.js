/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	yahoo:['calendar']
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		L = YAHOO.lang,
		NS = this.namespace;

	var YDate = YAHOO.widget.DateMath;
	
	NS.getDate = function(){
		return new Date();
	};
	
	NS.isCurrentDay = function(date){
		return YDate.clearTime(date).getTime() == YDate.clearTime(NS.getDate()).getTime(); 
	};
	
	NS.dateToTime = function(date){
		return lz(date.getHours())+':'+lz(date.getMinutes());
	};
	
	var lz = function(num){
		var snum = num+'';
		return snum.length == 1 ? '0'+snum : snum; 
	};
	NS.lz = lz;
	
	var TZ_OFFSET = (NS.getDate()).getTimezoneOffset(); 
	
	NS.dateClientToServer = function(date){
		var tz = TZ_OFFSET*60*1000;
		return (date.getTime()-tz)/1000; 
	};
	
	NS.dateServerToClient = function(unix){
		unix = unix * 1;
		var tz = TZ_OFFSET*60;
		return new Date((tz+unix)*1000);
	};
	
	NS.dateToKey = function(date){
		date = new Date(date.getTime());
		var d = new Date(date.setHours(0,0,0,0));
		var tz = TZ_OFFSET*60*1000;
		var key = (d.getTime()-tz)/YDate.ONE_DAY_MS ; 
		return key;
	};


};