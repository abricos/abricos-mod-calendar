/*
@version $Id$
@copyright Copyright (C) 2008 Abricos. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[
		{name: 'sys', files: ['data.js']},
		{name: 'calendar', files: ['lib.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var YDate = YAHOO.widget.DateMath;
	
	var NS = this.namespace,
		TMG = this.template, 
		API = NS.API;
	
	if (!NS.data){ NS.data = new Brick.util.data.byid.DataSet('calendar'); }

	var session = 1;
	var TaskListManager = function(callback){
		this.callback = callback;
		
		this.init();
	};
	TaskListManager.prototype = {
		config: null,
		hash: null,
		init: function(){
			this.hash = {};
			this.session = session++;
			NS.data.onComplete.subscribe(this.completeDataHandler, this, true);
		},
		destroy: function(){
			NS.data.onComplete.unsubscribe(this.completeDataHandler);
		},
		completeDataHandler: function(type, args){
			if (!args[0].check(['days'])){ return; }
			var rowsParam = NS.data.get('days').getAllRows();
			for (var n in rowsParam){
				var rows = rowsParam[n];
				if (rows.param['ss']*1 != this.session){
					return;
				}
				var uid = rows.param.uid;
				if (!this.hash[uid]){
					this.hash[uid] = new TaskList(this, uid);
				}
				this.hash[uid].update(rows);
			}
			NS.data.remove('days');
			this.callback();
		},
		toString: function(){
			return 'TaskListManager-'+this.session;
		},
		clear: function(){
			for (var uid in this.hash){
				this.hash[uid].destroy();
				delete this.hash[uid];
			}
			this.hash = {};
		},
		load: function(sprm, users){
			users = users || [Brick.env.user.id];

			var beginLoad = false;
			for (var i=0;i<users.length;i++){
				var prm = L.merge({
					bdt: NS.getDate(),
					edt: new Date,
					uid: users[i]
				}, sprm || {});
				
				var hash = this.hash;
				if (!hash[prm.uid]){
					hash[prm.uid] = new TaskList(this, prm.uid);
				}
				var taskList = hash[prm.uid];
				if (taskList.load(prm)){
					beginLoad = true;
				}
			}
			if (beginLoad){
				return true;
			}
			
			this.callback();
			return false;
		},
		getTask: function(taskid){
			for (var i in this.hash){
				var map = this.hash[i].map;
				for (var ii in map){
					var mapItem = map[ii];

	        		for (var iii in mapItem){
	    				var task = mapItem[iii];
	    				if (task.id == taskid){
	    					return task;
	    				}
	        		}
				}
			}
			return null;
		},
    	calcData: function(key, users){
    		var pds = [];
    		
    		users = users || [];
    		
    		var calcKey = users.join('-');

    		for (var nuid =0; nuid<users.length; nuid++){
    			
        		var mapItem = this.hash[users[nuid]].map[key];

        		for (var i in mapItem){
    				var task = mapItem[i];
    				
    				if (task['calc']){
    					// if (task['calc']['k'] == calcKey){ return; }
    				}
    				
    				var bdt = task.bdt * 1;
    				var edt = bdt + (task.edt*60);
    				
    				var find = false;
    				for (var ii=0;ii<pds.length;ii++){
    					var pd = pds[ii];
    					
    					if ((pd.bdt <= bdt && edt <= pd.edt) 
    						|| (pd.bdt > bdt && edt > pd.bdt && edt <= pd.edt) 
    						|| (pd.bdt < bdt && bdt < pd.edt && edt > pd.edt) 
    						|| (pd.bdt >= bdt && edt >= pd.edt)){
    						
    						find = true;
    						pd.bdt = Math.min(pd.bdt, bdt);
    						pd.edt = Math.max(pd.bdt, edt);
    						pd.els[pd.els.length] = task;
    					}
    				}
    				if (!find){
    					pds[pds.length] = {
    						bdt: bdt, edt: edt, els: [task]
    					};
    				}
        		}
    		}

			for (var i=0;i<pds.length;i++){
				var pd = pds[i];
				
				var cnt = pd.els.length;
				var allw = 0;
				var w = Math.floor(100 / cnt);
				for (var ii=0;ii<cnt;ii++){
					var task = pd.els[ii];
					var bdt = NS.dateServerToClient(task.bdt); 
					var edt = NS.dateServerToClient(task.bdt + task.edt * 60);

					task['calc'] = {
						'k': calcKey,
						'x': w*ii,
						'bdt': bdt ,
						'edt': edt
					};
					
					if (ii == cnt-1){ w = 100-allw; }
					task['calc']['w'] = w;

					allw += w;
				}
			}
    	}
	};
	NS.TaskListManager = TaskListManager;
	
	var TaskList = function(owner, userid){
		this.init(owner, userid);
	};
	TaskList.prototype = {
		map: null,
		bdt: null,
		edt: null,
		
		init: function(owner, userid){
			this.owner = owner;
			this.userid = userid;
			this.map = {};
			this.bdt = NS.getDate();
			this.edt = NS.getDate();
		},
		
		destroy: function(){
			this.owner = null;
			this.userid = null;
			for (var key in this.map){
				delete this.map[key];
			}
			this.map = null;
			this.bdt = null;
			this.edt = null;
		},
		
		update: function(rows){
			var days = rows.param['days'];
			
			for (var i=0;i<days.length;i++){
				var b = days[i]['b'];
				var e = days[i]['e'];
				
				for (var key=b; key<=e; key++){
					if (!this.map[key]){
						this.map[key] = {};
					}
				}
			}
			
			var keys = {},  __self = this, key;
			rows.foreach (function(row){
				key = __self.addTask(row.cell);
				keys[key] = key;
			});
		},
		
		addTask: function(task){
			var d = NS.dateServerToClient(task.bdt);
			
			var key = NS.dateToKey(d);
			
			if (!this.map[key]){
				this.map[key] = {};
			}
			task.bdt = task.bdt * 1;
			task.edt = task.edt * 1;
			
			if (task.edt > 60*24){
				var eh = 23-d.getHours();
				task.edt = eh*60+59;
			}
			
			this.map[key][task.id] = task;
			
			return key;
		},
		
		getTaskList: function(date){
			var key = NS.dateToKey(date);
			return this.map[key];
		},
		
		removeTaskList: function(date){
			var key = NS.dateToKey(date);
			delete this.map[key];
		},
		
		removeAll: function(){
			this.map = {};
		},
		
		load: function(period){
			var tbdt = period.bdt.getTime(),
				tedt = period.edt.getTime();

			var bday = NS.dateToKey(period.bdt);
			var eday = NS.dateToKey(period.edt);
			
			var mp = function(d){
				this.b = d; this.e = d;
				
				this.check = function(d){ return !(d - this.e > 1); };
				this.set = function(d){
					this.b = Math.min(this.b, d);
					this.e = Math.max(this.e, d);
				};
			};
			
			var necDays = [];
			var curMP = null;
			for (var i=bday;i<eday;i++){
				if (!this.map[i]){
					if (L.isNull(curMP)){
						curMP = new mp(i);
						necDays[necDays.length] = curMP;
					}else{
						if (curMP.check(i)){
							curMP.set(i);
						}else{
							curMP = new mp(i);
							necDays[necDays.length] = curMP;
						}
					}
				}
			}
			if (necDays.length == 0){ return false; }
			
			var rowsParam = {
				days: necDays,
				uid: this.userid,
				ss: this.owner.session
			};
			NS.data.get('days', true).getRows(rowsParam);
			return true;
		}
	};
	
	NS.TaskList = TaskList;

};
