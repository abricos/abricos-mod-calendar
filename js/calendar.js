/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[
		{name: 'sys', files: ['container.js']},
        {name: 'calendar', files: ['dayboard.js', 'weekboard.js', 'monthboard.js']}
	]
};
Component.entryPoint = function(NS){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var YDate = YAHOO.widget.DateMath;

	var buildTemplate = this.buildTemplate;

	var CalendarWidget = function(container){
		this.init(container);
	};
	CalendarWidget.prototype = {
		init: function(container){
			
			this.date = NS.getDate();
			
			buildTemplate(this, 'widget');
			var TM = this._TM;
			container.innerHTML = TM.replace('widget');
			
			var boards = {
				'day': new NS.DayBoardWidget(TM.getEl('widget.boardday')),
				'week': new NS.WeekBoardWidget(TM.getEl('widget.boardweek')),
				'month': new NS.MonthBoardWidget(TM.getEl('widget.boardmonth'))
			};
			this.boards = boards;
			
			NS.calendarManager.eventsLoadedEvent.subscribe(this.onEventsLoaded, this, true);

			
			boards['day'].timeClickEvent.subscribe(this.onBoardTimeClick, this, true);
			boards['week'].timeClickEvent.subscribe(this.onBoardTimeClick, this, true);

			boards['day'].eventClickEvent.subscribe(this.onEventClick, this, true);
			boards['week'].eventClickEvent.subscribe(this.onEventClick, this, true);
			
			boards['month'].eventsDayClickEvent.subscribe(this.onMonthEventsDayClick, this, true);
			
			var calendar = NS.API.initYUICalendar(TM.getElId('widget.calendar'));
			calendar.selectEvent.subscribe(this.onCalendarDateChanged, this, true);
			
			this.calendar = calendar;
			
			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e), e)){ E.stopEvent(e); }
			});
			
			this.selectBoard('week');
		
			this._minuteThread = null;
			this._startMinuteThread();
		},
		
		_startMinuteThread: function(){
    		if (!L.isNull(this._minuteThread)){ return; }
			var __self = this;
			this._minuteThread = setInterval(function(){
				__self._runMinute();
			}, 1000);
    	},
    	_stopMinuteThread: function(){
            clearInterval(this._minuteThread);
    	},
    	_runMinute: function(){
			for (var n in this.boards){
				this.boards[n].updateMarker();
			}
    	},
		destroy: function(){
			this._stopMinuteThread();
			this.calendar.selectEvent.unsubscribe(this.onCalendarDateChanged);
			
			this.boards['day'].timeClickEvent.unsubscribe(this.onBoardTimeClick);
			this.boards['week'].timeClickEvent.unsubscribe(this.onBoardTimeClick);

			this.boards['day'].eventClickEvent.unsubscribe(this.onEventClick);
			this.boards['week'].eventClickEvent.unsubscribe(this.onEventClick);
			
			this.boards['month'].eventsDayClickEvent.unsubscribe(this.onMonthEventsDayClick);
		},
		onClick: function(el){
			var tp = this._TId['widget'];
			
			switch(el.id){
			case tp['bselday']: this.selectBoard('day'); return true;
			case tp['bselweek']: this.selectBoard('week'); return true;
			case tp['bselmonth']: this.selectBoard('month'); return true;
			}
			
			return false;
		},
		selectBoard: function(name, date){
			var TM = this._TM;
			for (var n in this.boards){
				Dom.setStyle(TM.getEl('widget.board'+n), 'display', name == n ? '' : 'none');
				if (name == n){
					Dom.replaceClass(TM.getEl('widget.mflag'+n), 'moff', 'mon');
				}else{
					Dom.replaceClass(TM.getEl('widget.mflag'+n), 'mon', 'moff');
				}
			}
			var wBoard = this.boards[name];
			if (name == 'day' || name == 'week'){
				wBoard.scrollByTime();
			}
			
			this.selectedBoard = wBoard;
			this.setDate(date || this.date);
		},
		eventLoadByActivePeriod: function(){
			var period = this.selectedBoard.getPeriod();
			this.eventLoad(period);
		},
		_showLoading: function(){
			Dom.setStyle(this._TM.getEl('widget.loading'), 'display', '');
		},
		_hideLoading: function(){
			Dom.setStyle(this._TM.getEl('widget.loading'), 'display', 'none');
		},
		eventLoad: function(period){
			this._showLoading();
			var __self = this;
			NS.calendarManager.eventsLoad(period, function(){
				__self._hideLoading();
			});
		},
		renderEventsOnBoard: function(){
			for (var n in this.boards){
				this.boards[n].renderEvents();
			}
		},
		onEventsLoaded: function(){
			this.renderEventsOnBoard();
		},
		onMonthEventsDayClick: function(e, args){
			this.selectBoard('day', args[0]);
		},
		onEventClick: function(e, args){
			var ew = args[0], evt = ew.event;
			this.showEventEditPanel(evt);
		},
		onCalendarDateChanged: function(){
			if (this._lockCaneldarEvent){ return; }
			var date = this.calendar.getSelectedDates()[0];
			this._selectFromCalendar = true;
			this.setDate(date);
			this._selectFromCalendar = false;
		},
		onBoardTimeClick: function(e, args){
			this.showEventNewPanel(args[0]);
		},
		setDate: function(date){
			for (var n in this.boards){
				this.boards[n].setDate(date);
			}
			if (!this._selectFromCalendar){
				this._lockCaneldarEvent = true;
				var cal = this.calendar;
				cal.select(date);
				var selectedDates = cal.getSelectedDates();
				if (selectedDates.length > 0) {
					var firstDate = selectedDates[0];
					cal.cfg.setProperty("pagedate", (firstDate.getMonth()+1) + "/" + firstDate.getFullYear());
					cal.render();
				}
				this._lockCaneldarEvent = false;
			}
			this.eventLoadByActivePeriod();
		},
		showEventNewPanel: function(date){
			return new NS.EventNewEditPanel(date);
		},
		showEventEditPanel: function(event){
			return new NS.EventEditorPanel(event);
		}
	};
	NS.CalendarWidget = CalendarWidget;
	
	NS.API.initYUICalendar = function(containerid){
		var cal = new YAHOO.widget.Calendar("calendar", containerid, {
			'START_WEEKDAY': 1,
			'pagedate': NS.getDate(),
			today: NS.getDate()
		});
		
		var cfg = cal.cfg,
			lng = Brick.util.Language.getc('mod.calendar.dict'),
			dict = [];
		for (var i=1; i<=12; i++){
			dict[dict.length] = lng['month'][i]; 
		}
		cfg.setProperty("MONTHS_LONG", dict);

		dict = [];
		for (var i=0; i<7; i++){
			dict[dict.length] = lng['week']['short'][i]; 
		}
		cfg.setProperty("WEEKDAYS_SHORT", dict);
		
		cal.render();
		cal.select(NS.getDate());
		
		return cal;
	};
	
};