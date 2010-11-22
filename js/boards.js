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
	
	var NS = this.namespace,
		TMG = this.template;
	
	var YDate = YAHOO.widget.DateMath;
	
	var BOARD_HEIGHT = 1008;
	var MINUTE_ROUND = 30;
	
	
	var TaskBoardWidget = function(container, task, style){
		this.init(container, task, style);
	};
	TaskBoardWidget.prototype = {
		init: function(container, task, style){
			this.task = task;
			
			var TM = TMG.build('taskwidget'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			var div = document.createElement('div');
			div.innerHTML = TM.replace('taskwidget', {
				'clrtitle': style['title'],
				'clrbody': style['body']
			});
			var el = div.childNodes[0];
			div.removeChild(el);
			
			container.appendChild(el);
			this.el = el;
			this.hide();
			this.render();
		},
		onClick: function(el){
			var TId = this._TId;
			
			for (var i=0;i<4;i++){
				if (el.id == TId['taskwidget']['id']){
					return true;
				}
				el = el.parentNode;
			}
			
			return false;
		},
		destroy: function(){
			this.el.parentNode.removeChild(this.el);
		},
		isShow: function(){
			return this.el.style.display == '';
		},
		show: function(){
			this.el.style.display = '';
		},
		hide: function(){
			this.el.style.display = 'none';
		},
		render: function(){
    		var hourDY = BOARD_HEIGHT / 24;
			var minDY = hourDY / 60;
			
			var calc = this.task.calc;
			
			var bdt = calc['bdt'];
			var edt = calc['edt'];
			
			var y = bdt.getHours() * hourDY + bdt.getMinutes() * minDY;
			var y1 = edt.getHours() * hourDY + edt.getMinutes() * minDY ;
			var h = Math.max(y1 - y -3, 25);
			
			var el = this.el;
			
			Dom.setStyle(el, 'top', y+'px');
			Dom.setStyle(el.childNodes[0], 'height', h+'px');
			Dom.setStyle(el, 'left', calc['x']+'%');
			Dom.setStyle(el, 'width', calc['w']+'%');

			this._TM.getEl('taskwidget.tl').innerHTML = this.task.tl;
			this._TM.getEl('taskwidget.tm').innerHTML = NS.dateToTime(bdt)+' - '+NS.dateToTime(edt);
			this.updateActualy();
		},
		updateActualy: function(){
			if (this.task.calc.edt.getTime() < (NS.getDate()).getTime()){
				Dom.setStyle(this.el, 'opacity', 0.5);
			}
		}
	};
	NS.TaskBoardWidget = TaskBoardWidget;
	
	NS.DayBoardWidget = function(el, owner){
		this.init(el, owner);
	};
	NS.DayBoardWidget.prototype = {
		init: function(el, owner){
			this.el = el;
			this.owner = owner;
			
			var TM = TMG.build('day,dmarker,dhour'), 
				T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			this.el.innerHTML = TM.replace('day', {
				'markers': function(){
					var s = '';
					for(var ii=0;ii<24;ii++){ s += T['dmarker']; }
					return s;
				}(),
				'hours': function(){
					var s = '';
					for(var ii=0;ii<24;ii++){ 
						s += TM.replace('dhour', {'hour': (ii < 10 ? '0'+ii : ii)}); 
					}
					return s;
				}()
			});
			
			this.renderDate();
		},
		show: function(){ 
			this.el.style.display = '';
			this.scrollByTime();
			this.updateMarker();
		},
		hide: function(){ this.el.style.display = 'none'; },
		isShow: function(){ return this.el.style.display == '';},
		scrollByTime: function(d){
			d = d || NS.getDate();
			var hour = Math.max(d.getHours() - 2, 0);
			
			var board = this._TM.getEl('day.board');
			var hourDY = BOARD_HEIGHT / 24;
			board.scrollTop = hourDY * hour;
		},
		updateSize: function(height){
			height = height - 20;
			var board = this._TM.getEl('day.board');
			Dom.setStyle(board, 'height', height+'px');
		},
		
    	onClick: function(el, e){
			if (el.id == this._TM.getElId('day.col')){
				this._createTask(e);
				return false;
			}
			
			var tlst = this._taskList;
			for (var i=0;i<tlst.length;i++){
				if (tlst[i].onClick(el)){
					this.owner.showTask(tlst[i].task);
					return true;
				}
			}
			
			return false;
    	},
    	_createTask: function(e){
    		var elCol = this._TM.getEl('day.col');
    		
			var pos = E.getXY(e);
			var reg = Dom.getRegion(elCol);
			var x = pos[0] - reg.left;
			var y = pos[1] - reg.top;
			
			var hourDY = BOARD_HEIGHT / 24;
			var minDY = hourDY / 60;
			
			var hour = Math.ceil(y / hourDY) - 1;
			
			var minute = Math.ceil((y - hour * hourDY)/minDY);
			minute = Math.round(minute*0.1)*10;
			minute = minute < 31 ? 0 : 30;
			
			this.createTask(hour, minute);
    	},
    	createTask: function(hour, minute){
    		var pd = this.getPeriod();
    		
    		var beginDate = new Date(pd.bdt.setHours(hour, minute, 0, 0));
    		var endDate = new Date(pd.bdt.setHours(hour+1, minute, 0, 0));
    		
    		this.owner.createTask(beginDate, endDate);
    	},
		
		getPeriod: function(){
			var date = this.owner.calendar.getSelectedDates()[0];
			date = new Date(date.setHours(0, 0, 0, 0));
			return {'bdt': date, 'edt': YDate.add(date, YDate.DAY, 1)};
		},
		
		_lastBTime: 0,
		
		// если дата изменилась, перерисовать ее 
		renderDate: function(){
			var TM = this._TM;
			
			var pd = this.getPeriod();
			
			var date = pd.bdt;
			if (this._lastBTime == date.getTime()){ return; }
			this._lastBTime = date.getTime();
			
			var lng = Brick.util.Language.getc('mod.calendar.dict');
			TM.getEl('day.title').innerHTML = lng['week'][date.getDay()] +
				', '+date.getDate()+'/'+ (date.getMonth()+1);
			
			var elTitleCont = TM.getEl('day.titlecont');
			var elBoardSt = TM.getEl('day.boardstat');
			var elMarker = TM.getEl('day.marker');
			var elMarkerPoint = TM.getEl('day.markerpoint');
			
			if (NS.isCurrentDay(date)){
				Dom.addClass(elTitleCont, 'wk-today');
				Dom.addClass(elBoardSt, 'tg-today');
				elMarker.style.display = '';
				elMarkerPoint.style.display = '';
			}else{
				Dom.removeClass(elTitleCont, 'wk-today');
				Dom.removeClass(elBoardSt, 'tg-today');
				elMarker.style.display = 'none';
				elMarkerPoint.style.display = 'none';
			}
		},
		
    	_taskList: [],
		
    	clearTaskList: function(){
    		var lst = this._taskList;
    		for (var i=0;i<lst.length;i++){
    			lst[i].destroy(); 
    		}
    		this._taskList = [];
    	},
    	
    	renderTaskList: function(){
    		
    		this.clearTaskList();

    		var users = this.owner.getUsers();
    		
    		var pd = this.getPeriod();
    		var tlm = this.owner.taskManager;
    		var key = NS.dateToKey(pd.bdt);
    		
    		tlm.calcData(key, users);
    		
    		for (var i=0;i<users.length;i++){
    			
        		var userid = users[i];

        		var tasks = tlm.hash[userid]['map'][key];
        		
        		var elTaskList = this._TM.getEl('day.tasklist');
        		
        		for (var n in tasks){
        			var task = tasks[n];
    				this.renderTask(elTaskList, task, userid);
        		}
    		}
    	},

    	renderTask: function(container, task, userid){
    		var widget = new NS.TaskBoardWidget(container, task, this.owner.getTaskColor(userid));
    		this._taskList[this._taskList.length] = widget;
    		widget.show();
    	},
    	
    	updateMarker: function(){
    		if (!this.isShow()){ return; }
    		
    		var d = NS.getDate();
    		
			var hourDY = BOARD_HEIGHT / 24;
			var minDY = hourDY / 60;
			
			var elBoard = this._TM.getEl('day.board');
			var elMarkerPoint = this._TM.getEl('day.markerpoint');
			var elMarker = this._TM.getEl('day.markerline');
			
			var offset = Dom.getY(elBoard);

			var y = d.getHours() * hourDY + d.getMinutes() * minDY - elBoard.scrollTop+offset;
			
			Dom.setY(elMarker, y);
			Dom.setY(elMarkerPoint, y);
			
			var tlst = this._taskList;
			for (var i=0;i<tlst.length;i++){
				tlst[i].updateActualy();
			}
    	}
	};
	
	
	NS.WeekBoardWidget = function(el, owner){
		this.init(el, owner);
	};
	NS.WeekBoardWidget.prototype = {
		init: function(el, owner){
			this.owner = owner;
			this.el = el;
			
			var TM = TMG.build('week,wdtlrow,wmarker,whour,wcol'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			this.el.innerHTML = TM.replace('week', {
				'tlrows': function(){
					var s = '';
					for(var ii=0;ii<7;ii++){ 
						s += TM.replace('wdtlrow',{'id': ii}); 
					}
					return s;
				}(),
				'markers': function(){
					var s = '';
					for(var ii=0;ii<24;ii++){ s += T['wmarker']; }
					return s;
				}(),
				'hours': function(){
					var s = '';
					for(var ii=0;ii<24;ii++){ 
						s += TM.replace('whour', {
							'hour': (ii < 10 ? '0'+ii : ii)
						}); 
					}
					return s;
				}(),
				'cols': function(){
					var s = '';
					for(var ii=0;ii<7;ii++){ 
						s += TM.replace('wcol',{'id': ii}); 
					}
					return s;
				}()
			});
			
			this.renderDate();
		},
		show: function(){ 
			this.el.style.display = '';
			this.scrollByTime();
			this.updateMarker();
		},
		hide: function(){ this.el.style.display = 'none'; },
		isShow: function(){ return this.el.style.display == ''; },
		scrollByTime: function(d){
			d = d || NS.getDate();
			var hour = Math.max(d.getHours() - 2, 0);
			
			var board = this._TM.getEl('week.board');
			var hourDY = BOARD_HEIGHT / 24;
			board.scrollTop = hourDY * hour;
		},
		updateSize: function(height){
			height = height - 25;
			var board = this._TM.getEl('week.board');
			Dom.setStyle(board, 'height', height+'px');
		},
		getPeriod: function(){
			var date = this.owner.calendar.getSelectedDates()[0];

			var bdt = YDate.getFirstDayOfWeek(date, 1);
			var edt = YDate.add(bdt, YDate.DAY, 7);
			
			return {
				'bdt': bdt,
				'edt': new Date(edt.setHours(23, 59, 59, 0)) 
			};
		},
		
		_lastBTime: 0,
		
		renderDate: function(){
			var pd = this.getPeriod();
			if (this._lastBTime == pd.bdt.getTime()){ return; }
			this._lastBTime = pd.bdt.getTime();

			var TM = this._TM, TId = this._TId;
			var lng = Brick.util.Language.getc('mod.calendar.dict');

			var i, dt, wnum, day, month;
			for (var i=0;i<7;i++){
				dt = YDate.add(pd.bdt, YDate.DAY, i);
				var elCol = Dom.get(TId['wdtlrow']['tl']+'-'+i);
				elCol.innerHTML = lng['week']['short'][dt.getDay()]+', '+dt.getDate()+'/'+(dt.getMonth()+1);
				
				var elColToday = Dom.get(TId['wcol']['today']+'-'+i);
				var elColMarker = Dom.get(TId['wcol']['markercol']+'-'+i);
				
				if (NS.isCurrentDay(dt)){
					elColToday.style.display = '';
					// elColMarker.style.display = ''; 
				}else{
					elColToday.style.display = 'none';
					elColMarker.style.display = 'none'; 
				}
			}
		},
    	
    	_taskList: [],
    	
    	clearTaskList: function(){
    		var lst = this._taskList;
    		for (var i=0;i<lst.length;i++){
    			lst[i].destroy();
    		}
    		this._taskList = [];
    	},
    	
    	renderTaskList: function(){
    		this.clearTaskList();
    		
    		var users = this.owner.getUsers();
    		var pd = this.getPeriod();
    		var tlm = this.owner.taskManager;
    		
    		var TId = this._TId;
    		for (var ui=0;ui<users.length;ui++){
    			
        		var userid = users[ui], dt;
        		for (var i=0;i<7;i++){
    				dt = YDate.add(pd.bdt, YDate.DAY, i);
    				var wd = dt.getDay();
    	    		var key = NS.dateToKey(dt);
    	    		tlm.calcData(key, users);
    	    		var tasks = tlm.hash[userid]['map'][key];
    	    		
    	    		var elTaskList = Dom.get(TId['wcol']['tasklist']+'-'+i);

    	    		for (var n in tasks){
    	    			var task = tasks[n];
    					this.renderTask(elTaskList, task, userid);
    	    		}
        		}    			
    		}
    	},

    	renderTask: function(container, task, userid){
    		var widget = new NS.TaskBoardWidget(container, task, this.owner.getTaskColor(userid));
    		this._taskList[this._taskList.length] = widget;
    		widget.show();
    	},
    	
    	onClick: function(el, e){
    		var TId = this._TId;
    		
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (TId['wcol']['id']+'-'):
				this._createTask(numid, e);
				return true;
			}
			
			var tlst = this._taskList;
			for (var i=0;i<tlst.length;i++){
				if (tlst[i].onClick(el)){
					this.owner.showTask(tlst[i].task);
					return true;
				}
			}
			return false;
    	},
    	_createTask: function(numCol, e){
    		var TId = this._TId;
    		var elCol = Dom.get(TId['wcol']['id']+'-'+numCol); 
    		
			var pos = E.getXY(e);
			var reg = Dom.getRegion(elCol);
			var x = pos[0] - reg.left;
			var y = pos[1] - reg.top;
			
			var hourDY = BOARD_HEIGHT / 24;
			var minDY = hourDY / 60;
			
			var hour = Math.ceil(y / hourDY) - 1;
			
			var minute = Math.ceil((y - hour * hourDY)/minDY);
			minute = Math.round(minute*0.1)*10;
			minute = minute < 31 ? 0 : 30;
			
			this.createTask(numCol, hour, minute);
    	},
    	createTask: function(numCol, hour, minute){
    		var pd = this.getPeriod();
    		var dt = YDate.add(pd.bdt, YDate.DAY, numCol*1);
    		
    		var bdt = new Date(dt.setHours(hour, minute, 0, 0));
    		var edt = new Date(dt.setHours(hour+1, minute, 0, 0));
    		
    		this.owner.createTask(bdt, edt);
    	},
    	updateMarker: function(){
			var tlst = this._taskList;
			for (var i=0;i<tlst.length;i++){
				tlst[i].updateActualy();
			}

    		return; 
    		/*
    		if (!this.isShow()){ return; }
    		
    		var d = NS.getDate();
    		
			var hourDY = BOARD_HEIGHT / 24;
			var minDY = hourDY / 60;
			
			var elBoard = this._TM.getEl('day.board');
			var elMarkerPoint = this._TM.getEl('day.markerpoint');
			var elMarker = this._TM.getEl('day.markerline');
			
			var offset = Dom.getY(elBoard);

			var y = d.getHours() * hourDY + d.getMinutes() * minDY - elBoard.scrollTop+offset;
			
			Dom.setY(elMarker, y);
			Dom.setY(elMarkerPoint, y);
			*/
    	}
    };
	
	
	NS.MonthBoardWidget = function(el, owner){
		this.init(el, owner);
	};
	NS.MonthBoardWidget.prototype = {
		init: function(container, owner){
			
			var TM = TMG.build('month,mcols,mrow,mdt,mdtdaynum,mdtday,mtasks'),
				T = TM.data, TId = TM.idManager;

			this._TM = TM; this._T = T; this._TId = TId;
			
			this.el = container;
			this.owner = owner;
			
			var lst = "", top = 0;
			for (var i=0;i<5;i++){
				var dt = TM.replace('mdt', {
					'dayn': function(){
						var s = '';
						for(var ii=0;ii<7;ii++){
							s += TM.replace('mdtdaynum', {'id': i+'_'+ii});
						}
						return s;
					}(),
					'day': function(){
						var s = '';
						for(var ii=0;ii<7;ii++){
							s += TM.replace('mdtday', {'id': i+'_'+ii});
						}
						return s;
					}()
				});
				lst += TM.replace('mrow', { 
					'top': top,
					'cols': TM.replace('mcols', {'id': i}),
					'dt': dt
				});
				top += 20;
			}
			
			this.el.innerHTML = TM.replace('month', { 'rows': lst });
		},
		show: function(){ this.el.style.display = ''; },
		hide: function(){ this.el.style.display = 'none'; },
		updateSize: function(height){ },
		getPeriod: function(){
			var cal = this.owner.calendar;
			var dates = cal.cellDates;
			var bdd = dates[0];
			var edd = dates[dates.length-1];
			
			return {
				'bdt': new Date(bdd[0], bdd[1]-1, bdd[2], 0, 0, 0),
				'edt': new Date(edd[0], edd[1]-1, edd[2], 23, 59, 59) 
			};
		},
		
		_cache: {},
		
		_lastBTime: 0,
		
		renderDate: function(){
			var pd = this.getPeriod();
			if (this._lastBTime == pd.bdt.getTime()){ return; }
			this._lastBTime = pd.bdt.getTime();

			var cal = this.owner.calendar;
			var dates = cal.cellDates;
			var date = cal.getSelectedDates()[0];
			var numMonth = date.getMonth()+1;

			var TM = this._TM, T = this._T, TId = this._TId;
			
			var lng = Brick.util.Language.getc('mod.calendar.dict');
			var cd, day, mnt, index = 0, el, cellDate;
			var currentDate = (NS.getDate()).setHours(0, 0, 0, 0);
			var cache = this._cache;

			for (var i=0;i<5;i++){
				for(var ii=0;ii<7;ii++){
					cd = dates[index];
					day = cd[2]; mnt = cd[1];
					cellDate = (new Date(cd[0], cd[1]-1, cd[2], 0, 0, 0)).getTime();
					
					if (!cache[index]){
						cache[index] = Dom.get(TId['mdtdaynum']['id']+'-'+i+'_'+ii);
					}
					el = cache[index];
					el.innerHTML = day + (day == 1 ? ' '+lng['month']['short'][mnt] : '');
					
					if (numMonth != mnt){
						Dom.addClass(el.parentNode, 'st-dtitle-nonmonth');
					}else{
						Dom.removeClass(el.parentNode, 'st-dtitle-nonmonth');
					}
					if (cellDate == currentDate){
						Dom.addClass(el.parentNode, 'st-dtitle-today');
					}else{
						Dom.removeClass(el.parentNode, 'st-dtitle-today');
					}
						
					index++;
				}
			}
		},
		_cacheDay: {},
		
    	clearTaskList: function(){
			var index = 0;
			var cache = this._cacheDay;
			for (var i=0;i<5;i++){
				for(var ii=0;ii<7;ii++){
					if (cache[index]){
						var el = cache[index];
						el.innerHTML = "";
					}
					index++;
				}
			}
    	},
		
    	renderTaskList: function(){
    		this.clearTaskList();
    		
    		var tlm = this.owner.taskManager;
    		var pd = this.getPeriod();
			var cal = this.owner.calendar;
			var dates = cal.cellDates;
			var TM = this._TM, T = this._T, TId = this._TId;
			
			var day, mnt, index = 0, el;
			var cache = this._cacheDay;
			
    		var users = this.owner.getUsers();

			for (var i=0;i<5;i++){
				for(var ii=0;ii<7;ii++){
					
					var cd = dates[index];
					var cellDate = new Date(cd[0], cd[1]-1, cd[2], 0, 0, 0);
					var key = NS.dateToKey(cellDate);
		    		tlm.calcData(key, users);
					
					if (!cache[index]){
						cache[index] = Dom.get(TId['mdtday']['id']+'-'+i+'_'+ii);
					}
					el = cache[index];
					var count = 0;
					
		    		for (var ui=0;ui<users.length;ui++){
		        		var userid = users[ui];
						
			    		var tasks = tlm.hash[userid]['map'][key];
						
						for (var n in tasks){
							count++;
			    		}
					}
					if (count > 0){
						el.innerHTML = TM.replace('mtasks', {
							'id': index,
							'count':count
						});
					}
					index++;
				}
    		}
		},
    	onClick: function(el){
    		var TId = this._TId;
    		
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (TId['mtasks']['id']+'-'):
				this.showDayBoard(numid);
				return true;
			}

			return false;
    	},
    	showDayBoard: function(index){
			var dates = this.owner.calendar.cellDates;
			cd = dates[index];
			this.owner.navBoard.showDayBoard();
			this.owner.calendar.select(new Date(cd[0], cd[1]-1, cd[2], 0, 0, 0));
    	}
	};
	
};
