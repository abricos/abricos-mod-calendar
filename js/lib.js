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
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace;
	NS.BOARD_HEIGHT = 1008;

	var Event = function(d){
		d = L.merge({
			'id': 0,		// идентификатор
			'bdt': 0,		// время начала
			'edt': 0,		// время конца
			'tl': '',		// заголовок
			'dl': 0,		// время создания
			'udl': 0,		// время обновления
			'own': '',		// модуль
			'tnm': ''		// имя типа
		}, d || {});
		this.init(d);
	};
	Event.prototype = {
		init: function(d){
			this.id = d['id'];
			this.owner = d['own'];
			this.tname = d['tnm'];
			this.update(d);
		},
		update: function(d){
			this.bDate = NS.dateServerToClient(d['bdt']);
			this.eDate = NS.dateServerToClient(d['edt']);
			this.title = d['tl'];
		},
		getSaveData: function(){
			var t = this;
			var sd = {
				'id': t.id,
				'bdt': NS.dateClientToServer(this.bDate),
				'edt': NS.dateClientToServer(this.eDate),
				'tl': t.title
			};
			return sd;
		}
	};
	NS.Event = Event;
	
	var EventList = function(d){
		d = d || [];
		this.init(d);
	};
	EventList.prototype = {
		init: function(d){
			this.list = [];
		},
		count: function(){
			return this.list.length;
		},
		foreach: function(f){
			if (!L.isFunction(f)){ return; }
			for (var i=0;i<this.list.length;i++){
				if (f(this.list[i])){ return; }
			}
		},
		add: function(event){
			this.list[this.list.length] = event;
		},
		clear: function(){
			this.list = [];
		},
		get: function(id){
			var lst = this.list;
			for (var i=0;i<lst.length;i++){
				if (lst[i].id*1 == id*1){ return lst[i]; }
			}
			return null;
		},
		remove: function(id){
			var lst = this.list, nlst = [];
			for (var i=0;i<lst.length;i++){
				if (lst[i].id*1 != id*1){ 
					nlst[nlst.length] = lst[i];
				}
			}
			this.list = nlst;
		}
	};
	NS.EventList = EventList;
	
	// абстрактный класс календарной доски
	var BoardWidget = function(container){
		this.init(container);
	};
	BoardWidget.prototype = {
		init: function(container){
			this.eWidgets = [];
			
			this.timeClickEvent = new YAHOO.util.CustomEvent("timeClickEvent");
			this.eventClickEvent = new YAHOO.util.CustomEvent("eventClickEvent");
			
			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e), e)){ E.stopEvent(e); }
			});
			setTimeout(function(){
				__self.scrollByTime();
			}, 500);
			
			this._savedLastRenderDate = null;
			this.setDate(NS.getDate());
		},
		destroy: function(){},
		setDate: function(date){
			this.date = date;
			
			if (this._savedLastRenderDate != date){ 
				this._savedLastRenderDate = date;
				this.render();
				this.renderEvents();
				this.scrollByTime();
			}
			this.updateMarker();
		},
		getPeriod: function(){
			return {'bdt': this._fromDate, 'edt': this._endDate };
		},
		updateMarker: function(){},
		scrollByTime: function(){},
		onClick: function(el, e){
			var ws = this.eWidgets;
			for (var i=0;i<ws.length;i++){
				if (ws[i].onClick(el, e)){ return true; }
			}
			return false; 
		},
		onEventWidgetClick: function(eWidget){
			this.eventClickEvent.fire(eWidget);
		},
		onTimeClick: function(){},
		getTimeByPosition: function(x, y, notRound){ return [0, 0]; },
		render: function(){ },
		renderEvents: function(){
			var ws = this.eWidgets;
			for (var i=0;i<ws.length;i++){
				ws[i].destroy();
			}
			ws = [];
    		var pd = this.getPeriod(),
    			__self = this;
    		NS.calendarManager.foreach(function(type, event){
    			
    			var w = __self.renderEvent(type, event);
    			if (!L.isNull(w)){
        			ws[ws.length] = w;
    			}
    		}, pd['bdt'], pd['edt']);
    		this.eWidgets = ws;
    	},
		renderEvent: function(type, event){},
		foreach: function(f){
			if (!L.isFunction(f)){ return; }
			var ws = this.eWidgets;
			for (var i=0;i<ws.length;i++){
				if (f(ws[i])){ return; }
			}
		}
	};
	
	NS.BoardWidget = BoardWidget;
	
	var EventEditorWidget = function(container, event){
		this.init(container, event);
	};
	EventEditorWidget.prototype = {
		// инициализировать виджет
		init: function(container, event){
			this.event = event;
		},

		// создать и вернуть событие для сохранения в календарь
		// вызывает родитель по кнопке "Создать"
		// если вернет null, значит ошибка в полях ввода
		buildEvent: function(){ return null; }
	};
	NS.EventEditorWidget = EventEditorWidget;

	// тип события
	var EventType = function(cfg){
		this.init(cfg);
	};
	EventType.prototype = {
		init: function(cfg){
			this.id = 0;
			this.owner = cfg['owner'];
			this.tname = cfg['tname'];
			this.title = cfg['title'];

			// класс виджета редактора
			this.editor = cfg['editor'];

			// класс события
			this.event = cfg['event'];
			
			this.eventList = new EventList();
		}
	};
	NS.EventType = EventType;
	
	// менеджер событий
	var EventTypeManager = function(){
		this.init();
	};
	EventTypeManager.prototype = {
		init: function(){
			this._idcounter = 1;
			this.types = [];
		},
		register: function(et){
			this.types[this.types.length] = et;
			et.id = this.types.length;
		},
		foreach: function(f){
			if (!L.isFunction(f)){ return; }
			var tps = this.types;
			for (var i=0;i<tps.length;i++){
				if (f(tps[i])){ return; }
			}
		},
		get: function(owner, tname){
			var type = null;
			this.foreach(function(t){
				if (t.owner == owner && t.tname == tname){
					type = t;
					return true;
				}
			});
			return type;
		}
	};
	NS.EventTypeManager = EventTypeManager;
	NS.eventTypeManager = new EventTypeManager();
	
	
	// менеджер запроса периода событий
	var PeriodLoader = function(){
		this.init();
	};
	PeriodLoader.prototype = {
		init: function(){
			this.list = [];
		},
		foreach: function(f){
			if (!L.isFunction(f)){ return; }
			var lst = this.list, di;
			for (var i=0;i<lst.length;i++){
				di = lst[i];
				if (f(di, i)){ return; }
			}
		},
		count: function(){ return this.list.length; },
		add: function(bDate, eDate){
			var nd = function(dt){return (new Date(dt.setHours(0, 0, 0)))/1000;};
			var p = {
				'bdt': bDate,
				'bnd': nd(bDate),
				'edt': eDate,
				'end': nd(eDate),
				'days': (eDate.getTime() - bDate.getTime())/1000/86400
			};
			
			// можно ли добавить или уже есть больший период?
			var find = false;
			this.foreach(function(cp){
				if (p['bnd'] >= cp['bnd'] && p['end']<=cp['end']){
					find = true;
					return true; 
				}
			});
			if (find){ return null; }
			
			this.list[this.list.length] = p;
			return p;
		},
		buildPeriod: function(bDate, eDate){
			var p = this.add(bDate, eDate);
			return p;
		}
	};
	NS.PeriodLoader = PeriodLoader;
	
	var CalendarManager = function(callback){
		this.init(callback);
	};
	CalendarManager.prototype = {
		init: function(callback){
			NS.calendarManager = this;
			
			this.periodLoader = new PeriodLoader();
			callback = L.isFunction(callback) ? callback : function(){};
			
			this.eventsLoadedEvent = new YAHOO.util.CustomEvent("eventsLoadedEvent");

			// необходимо просканировать все модули на наличе реализации API календаря
			var list = [];
			for (var m in Brick.Modules){
				if (Brick.componentExists(m, 'calenapi') && !Brick.componentLoaded(m, 'calenapi')){
					list[list.length] = {name: m, files:['calenapi.js']};
				}
			}
			
			var __self = this;
			if (list.length > 0){
				Brick.Loader.add({ 
					mod: list,
					onSuccess: function() { 
						 callback(__self);
					}
				});
			}else{
				 callback(__self);
			}
		},
		_getETypes: function(){
			var list = [];
			NS.eventTypeManager.foreach(function(et){
				list[list.length] = {
					'own': et.owner,
					'tnm': et.tname
				};
			});
			return list;
		},
		foreach: function(f, bDate, eDate){
			if (!L.isFunction(f)){ return; }
			NS.eventTypeManager.foreach(function(type){
				var exit = false;
				type.eventList.foreach(function(event){
					if (bDate && event.eDate < bDate) { return; }
					if (eDate && event.bDate > eDate) { return; }
					
					if (f(type, event)){
						exit = true;
						return true;
					}
				});
				return exit;
			});
		},
		_eventUpdate: function(type, d){
			if (L.isNull(d)){ return; }
			var elist = type.eventList,
				evt = elist.get(d['id']);

			if (L.isNull(evt)){
				evt = new type['event'](d);
				elist.add(evt);
			}else{
				evt.update(d);
			}
		},
		_eventsUpdate: function(d){
			if (L.isNull(d)){ return; }
			
			for (var i=0;i<d.length; i++){
				var di = d[i];
				
				var type = NS.eventTypeManager.get(di['own'], di['tnm']);
				if (L.isNull(type)){ // ???
					continue;
				}
				for (var ii=0; ii<di['evs'].length;ii++){
					this._eventUpdate(type, di['evs'][ii]);
				}
			}
		},
		eventsLoad: function(period, callback){
			period = this.periodLoader.add(period['bdt'], period['edt']);
			callback = L.isFunction(callback) ? callback : function(){};
			
			if (L.isNull(period)){
				callback();
				return; 
			}
			
			var types = this._getETypes(),
				__self = this;

			Brick.ajax('calendar', {
				'data': {
					'do': 'events',
					'types': types,
					'bdt': NS.dateClientToServer(period['bdt']),
					'edt': NS.dateClientToServer(period['edt'])
				},
				'event': function(request){
					__self._eventsUpdate(request.data);
					callback();
					__self.onEventsLoaded();
				}
			});
		},
		eventSave: function(owner, tname, sd, callback){
			var type = NS.eventTypeManager.get(owner, tname), 
				__self = this;
			
			Brick.ajax('calendar', {
				'data': {
					'do': 'eventsave',
					'owner': owner,
					'tname': tname,
					'event': sd
				},
				'event': function(request){
					__self._eventUpdate(type, request.data);
					if (L.isFunction(callback)){ 
						callback(); 
					}
					__self.onEventsLoaded();
				}
			});
		},
		eventRemove: function(owner, tname, eventid, callback){
			var type = NS.eventTypeManager.get(owner, tname), 
				__self = this;
			
			Brick.ajax('calendar', {
				'data': {
					'do': 'eventremove',
					'owner': owner,
					'tname': tname,
					'eventid': eventid
				},
				'event': function(request){
					var ed = request.data;
					if (!L.isNull(ed) && ed*1 == eventid*1){
						type.eventList.remove(eventid);
					}
					if (L.isFunction(callback)){
						callback(); 
					}
					__self.onEventsLoaded();
				}
			});
			
		},
		onEventsLoaded: function(){
			this.eventsLoadedEvent.fire();
		}
	};
	NS.CalendarManager = CalendarManager;
	NS.calendarManager = null;
	
	NS.initCalendarManager = function(callback){
		callback = L.isFunction(callback) ? callback : function(){};
		
		if (L.isNull(NS.calendarManager)){
			new CalendarManager(function(cm){
				callback(cm);
			});
		}
	};

	
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
		var ret = (date.getTime()-tz)/1000;
		return ret;
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