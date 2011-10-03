/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[
        {name: 'calendar', files: ['calendar.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace, 
		TMG = this.template,
		API = NS.API,
		R = NS.roles;

	var initCSS = false,
		buildTemplate = function(w, ts){
		if (!initCSS){
			Brick.util.CSS.update(Brick.util.CSS['calendar']['board']);
			delete Brick.util.CSS['calendar']['board'];
			initCSS = true;
		}
		w._TM = TMG.build(ts); w._T = w._TM.data; w._TId = w._TM.idManager;
	};	
	
	var BoardPanel = function(){
		BoardPanel.superclass.constructor.call(this, {
			fixedcenter: true, width: '790px',
			controlbox: 1
		});
	};
	YAHOO.extend(BoardPanel, Brick.widget.Panel, {
		initTemplate: function(){
			buildTemplate(this, 'panel');
			return this._TM.replace('panel');
		},
		onLoad: function(){
			var TM = this._TM;
			this.calendarWidget = new NS.CalendarWidget(TM.getEl('panel.widget'));
		},
		destroy: function(){
			this.calendarWidget.destroy();
			BoardPanel.superclass.destroy.call(this);
		}
	});
	NS.BoardPanel = BoardPanel;
	
	API.showBoardPanel = function(){
		NS.initCalendarManager(function(){
			new BoardPanel();
		});
	};
};