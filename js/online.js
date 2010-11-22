/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[
		{name: 'sys', files: ['data.js']},
        {name: 'online', files: ['manager.js']},
        {name: 'calendar', files: ['data.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace, 
		TMG = this.template,
		API = NS.API;
	
	if (!NS.data){
		NS.data = new Brick.util.data.byid.DataSet('calendar');
	}
	
	var YDate = YAHOO.widget.DateMath;

	var buildTemplate = function(w, templates){
		var TM = TMG.build(templates), T = TM.data, TId = TM.idManager;
		w._TM = TM; w._T = T; w._TId = TId;
	};
	
	var ONL = Brick.mod.online; 
	
	var MyTaskOnline = function(){
		MyTaskOnline.superclass.constructor.call(this, 'calendar', 'main');
	};
	YAHOO.extend(MyTaskOnline, ONL.OnlineElement, {
		onLoad: function(){
			buildTemplate(this, 'widget,title,row,header');
			var TM = this._TM, T = this._T;

			this.setTitleValue(T['title']);
			this.getBody().innerHTML = TM.replace('widget');
			
			var __self = this;
			this.taskManager = new NS.TaskListManager(function(){
				__self.renderTaskList();
			});
			this.refresh();
		},
		destroy: function(){
			this.taskManager.destroy();
			MyTaskOnline.superclass.destroy.call(this);
		},
		renderTaskList: function(){
			this.hideWait();
			
    		var pd = this.getPeriod();
    		var tlm = this.taskManager;
    		var key = NS.dateToKey(pd.bdt);
    		var userid = Brick.env.user.id;
    		
    		tlm.calcData(key, [userid]);

       		var tasks = tlm.hash[userid]['map'][key];
        		
			var TM = this._TM, lst="";

    		for (var n in tasks){
    			var task = tasks[n];
    			var date = task.calc.bdt; 
    			var day = date.getDate();
    			var month = date.getMonth()+1;
    			var year = date.getFullYear();
    			var hour = date.getHours();
    			var min = date.getMinutes();
    			
    			lst += TM.replace('row', {
					'id': task['id'],
					'dl': NS.lz(day)+"."+NS.lz(month)+'.'+year+' '+NS.lz(hour)+":"+NS.lz(min),
					'tl': task['tl']
				});
    		}
			TM.getEl('widget.list').innerHTML = lst;
		},
		getPeriod: function(){
			var date = new Date();
			date = new Date(date.setHours(0, 0, 0, 0));
			return {'bdt': date, 'edt': YDate.add(date, YDate.DAY, 1)};
		},
		refresh: function(){
			this.showWait();
			var period = this.getPeriod();
			this.taskManager.clear();
			this.taskManager.load(period);
			NS.data.request();
		},
		onClick: function(el){
			var TId = this._TId;

			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (TId['row']['show']+'-'): this.showTask(numid); return true;
			}
			return false;
		},
		showTask: function(taskid){
			var task = this.taskManager.getTask(taskid),
				__self = this;

			Brick.ff('calendar', 'taskedit', function(){
	    		var taskEditor = new NS.TaskEditPanel(task, function(){
					__self.refresh();
				});
			});
		}
		
	});
	
	if (Brick.Permission.check('calendar', '30') > 0){
		ONL.manager.register(new MyTaskOnline());
	}
	
};