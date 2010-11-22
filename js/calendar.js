/*
@version $Id$
@copyright Copyright (C) 2008 Abricos. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[
		{name: 'sys', files: ['data.js', 'form.js', 'container.js']},
		{name: 'calendar', files: ['lib.js', 'data.js', 'roles.js', 'boards.js', 'taskedit.js', 'users.js']}
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
	
	var buildTemplate = function(w, templates){
		var TM = TMG.build(templates), T = TM.data, TId = TM.idManager;
		w._TM = TM; w._T = T; w._TId = TId;
	};

	
	Brick.util.CSS.update(Brick.util.CSS['calendar']['calendar']);
	delete Brick.util.CSS['calendar']['calendar'];

	var CalendarWidget = function(container){
		this.init(container);
	};
	CalendarWidget.prototype = {
		init: function(container){
			this.container = container;
			
			buildTemplate(this, 'widget');
			var TM = this._TM, TId = this._TId, T = this._T;
			
			container.innerHTML = T['widget'];
			
			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e), e)){ E.stopEvent(e); }
			});
			
			var calendar = new YAHOO.widget.Calendar("calendar", TM.getElId('widget.calendar'), {
				'START_WEEKDAY': 1,
				'pagedate': NS.getDate(),
				today: NS.getDate()
			}); 
			
			this.calendar = calendar;
			NS.calendarLocalize(calendar);
			calendar.render();
			calendar.select(NS.getDate());
			calendar.selectEvent.subscribe(function(){
				__self.refresh();
			}, this, true);
			
			this.taskManager = new NS.TaskListManager(function(){
				__self.navBoard.selectedBoard.renderTaskList();
			});
			
			var el = function(n){ return TM.getEl('widget.'+n);};
			
			var dayBoard = this.dayBoard = new NS.DayBoardWidget(el('dayboard'), this);
			this.weekBoard = new NS.WeekBoardWidget(el('weekboard'), this);
			this.monthBoard = new NS.MonthBoardWidget(el('monthboard'), this);
			this.navBoard = new NavigateBoardWidget(el('navboard'), this);
			this.navBoard.showDayBoard();
			
			this.usersWidget = new NS.UserListWidget(el('users'), this);
			
			this.refresh();
			this._startThread();

            setTimeout(function () {
            	dayBoard.scrollByTime();
            }, 100);
            
			this.updateSize();
		},
		
		destroy: function(){
			this._stopThread();
			this.taskManager.destroy();
		},
		
		updateSize: function(){
			var rg = Dom.getRegion(this.container);
			var height = rg.height - 40;
			var board = this._TM.getEl('widget.board');
			Dom.setStyle(board, 'height', height+'px');
			this.dayBoard.updateSize(height);
			this.weekBoard.updateSize(height);
			this.monthBoard.updateSize(height);
		},
		
    	onClick: function(el, e){
			if (this.navBoard.onClick(el, e)){ return true; }
			if (this.dayBoard.onClick(el, e)){ return true; }
			if (this.weekBoard.onClick(el, e)){ return true; }
			if (this.monthBoard.onClick(el, e)){ return true; }
				
			return false;
    	},
    	
    	_thread: null,
    	_thread5min: null,
    	
    	_startThread: function(){
			var __self = this;
    		if (L.isNull(this._thread)){
    			this._thread = setInterval(function(){__self._run();}, 60*1000); 
    		}
    		if (L.isNull(this._thread5min)){
    			this._thread5min = setInterval(function(){__self._run5min();}, 5*60*1000); 
    		}
    	},
    	_stopThread: function(){
            clearInterval(this._thread);
            clearInterval(this._thread5min);
    	},
    	_run: function(){
    		this.dayBoard.updateMarker();
    		this.weekBoard.updateMarker();
    	},
    	_run5min: function(){ this.refresh(true); },
    	
    	
    	createTask: function(bdate, edate, callback){
    		var __self = this;
    		
    		callback = callback || function(){
				__self.taskManager.hash[Brick.env.user.id].removeTaskList(bdate);
				__self.refresh();
			}; 
    		
    		return new NS.TaskEditPanel({calc: {bdt: bdate, edt: edate }}, callback);
    	},
    	
    	showTask: function(task, callback){
    		var __self = this;
    		
    		callback = callback || function(){
				__self.taskManager.hash[Brick.env.user.id].removeTaskList(task.calc.bdt);
				__self.refresh();
			}; 

    		var taskEditor = new NS.TaskEditPanel(task, callback);
    		return taskEditor;
    	},
    	
		getUsers: function(){
			return [Brick.env.user.id];
		},
		
		getTaskColor: function(userid){
			return {
				'title': '41, 82, 163',
				'body': '102, 140, 217'
			}; 
		},
		refresh: function(clear){
			clear = clear || false;
			if (clear){
				this.taskManager.clear();
			}
			
			var board = this.navBoard.selectedBoard; 
			board.renderDate();
			var period = board.getPeriod();
			this.taskManager.load(period, this.getUsers());
			NS.data.request();
		},
		showBoard: function(name){
			switch(name){
			case 'day': this.navBoard.showDayBoard(); break;
			case 'week': this.navBoard.showWeekBoard(); break;
			case 'month': this.navBoard.showMonthBoard(); break;
			}
			this.refresh();
		}

	};
	NS.CalendarWidget = CalendarWidget;
	
	var CalendarPanel = function(){
		CalendarPanel.superclass.constructor.call(this, {
			width: "800px", height: "650px",
			fixedcenter: true,
			controlbox: 1,
			state: Brick.widget.Panel.STATE_MAXIMIZED,
			overflow: false,
			minwidth: 600,
			minheight: 500
		});
	};
	YAHOO.extend(CalendarPanel, Brick.widget.Panel, {
		initTemplate: function(){
			buildTemplate(this, 'panel');
			return this._T['panel'];
		},
		onLoad: function(){
			this.calendarWidget = new NS.CalendarWidget(this._TM.getEl('panel.container'));
		},
		destroy: function(){
			CalendarPanel.superclass.destroy.call(this);
			this.calendarWidget.destroy();
		},
		onResize: function(){
			this.calendarWidget.updateSize();
		}	
	});
	NS.CalendarPanel = CalendarPanel;
	
	API.runApplication = function(){
		new NS.CalendarPanel();
	};


	
	var NavigateBoardWidget = function(el, owner){
		this.init(el, owner);
	};
	NavigateBoardWidget.prototype = {
		selectedBoard: null,
		init: function(el, owner){
			this.el = el; 
			this.owner = owner;
			
			var TM = TMG.build('navboard,navboardcol'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			el.innerHTML = TM.replace('navboard', {
				'col': T['navboardcol']
			});
		},
		_navButSetStatus: function(name, status){
			var el = this._TM.getEl('navboard.'+name).parentNode;
			if (status){
				Dom.replaceClass(el, 'modelinkOff', 'modelinkOn');
			}else{
				Dom.replaceClass(el, 'modelinkOn', 'modelinkOff');
			}
		},
		_hideAllBoard: function(){
			this.owner.dayBoard.hide();
			this.owner.monthBoard.hide();
			this.owner.weekBoard.hide();
			this._navButSetStatus('bselday', false);
			this._navButSetStatus('bselweek', false);
			this._navButSetStatus('bselmonth', false);
		},
		showDayBoard: function(){
			this._hideAllBoard();
			this.owner.dayBoard.show();
			this._navButSetStatus('bselday', true);
			this.selectedBoard = this.owner.dayBoard;
		},
		showWeekBoard: function(){
			this._hideAllBoard();
			this.owner.weekBoard.show();
			this._navButSetStatus('bselweek', true);
			this.selectedBoard = this.owner.weekBoard;
		},
		showMonthBoard: function(){
			this._hideAllBoard();
			this.owner.monthBoard.show();
			this._navButSetStatus('bselmonth', true);
			this.selectedBoard = this.owner.monthBoard;
		},
    	onClick: function(el){
			var tp = this._TId['navboard'];
			switch(el.id){
			case tp['bselday']:
				this.owner.showBoard('day');
				return true;
			case tp['bselweek']:
				this.owner.showBoard('week');
				return true;
			case tp['bselmonth']: 
				this.owner.showBoard('month');
				return true;
			case tp['brefresh']: 
				this.owner.refresh(true);
				return true;
			}
			return false;
    	}
	};
	
	NS.calendarLocalize = function(cal){
		var cfg = cal.cfg;
		
		var lng = Brick.util.Language.getc('mod.calendar.dict');
		
		var dict = [];
		for (var i=1; i<=12; i++){
			dict[dict.length] = lng['month'][i]; 
		}
		cfg.setProperty("MONTHS_LONG", dict);

		dict = [];
		for (var i=0; i<7; i++){
			dict[dict.length] = lng['week']['short'][i]; 
		}
		cfg.setProperty("WEEKDAYS_SHORT", dict);
	};

};
