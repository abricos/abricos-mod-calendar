/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[
		{name: 'calendar', files: ['event.js']}
	]
};
Component.entryPoint = function(NS){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var YDate = YAHOO.widget.DateMath;

	var buildTemplate = this.buildTemplate;

	
	var MonthBoardWidget = function(container){
		MonthBoardWidget.superclass.constructor.call(this, container);
	};
	YAHOO.extend(MonthBoardWidget, NS.BoardWidget, {
		init: function(container){
			
			this.eventsDayClickEvent = new YAHOO.util.CustomEvent("eventsDayClickEvent");

			this._elcache = [];
			
			buildTemplate(this, 'month,mcols,mrow,mdt,mdtdaynum,mdtday,mevents');
			var TM = this._TM;

			var lst = "", top = 0;
			for (var i=0;i<=5;i++){
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
					'id': i,
					'top': top,
					'cols': TM.replace('mcols', {'id': i}),
					'dt': dt
				});
				top += 16.6667;
			}
			
			container.innerHTML = TM.replace('month', { 'rows': lst });
			
			MonthBoardWidget.superclass.init.call(this, container);
		},
		
		setDate: function(date){
			date = new Date(date.setHours(0, 0, 0, 0));
			
			var firstDay = new Date(date.setDate(1));
			firstDay = YDate.getFirstDayOfWeek(firstDay, 1);
			
			var fd = this._fromDate = new Date(firstDay.setHours(0, 0, 0, 0));
			this._endDate = YDate.add(fd, YDate.DAY, 7*5);
			
			MonthBoardWidget.superclass.setDate.call(this, date);
		},
		
		render: function(){
			var TId = this._TId,
				cd = new Date(this._fromDate),
				index = 0,
				cache = this._elcache,
				lng = Brick.util.Language.getc('mod.calendar.dict'),
				curMonth = (new Date()).getMonth();
			
			for (var i=0;i<=5;i++){
				for(var ii=0;ii<7;ii++){
					var month = cd.getMonth(),
						day = cd.getDate();
					
					if (!cache[index]){
						cache[index] = Dom.get(TId['mdtdaynum']['id']+'-'+i+'_'+ii);
					}
					var el = cache[index];
					el.innerHTML = day + (day == 1 ? ' '+lng['month']['short'][month+1] : '');
					
					if (curMonth != month){
						Dom.addClass(el.parentNode, 'st-dtitle-nonmonth');
					}else{
						Dom.removeClass(el.parentNode, 'st-dtitle-nonmonth');
					}
					
					if (NS.isCurrentDay(cd)){
						Dom.addClass(el.parentNode, 'st-dtitle-today');
					}else{
						Dom.removeClass(el.parentNode, 'st-dtitle-today');
					}

					cd = YDate.add(cd, YDate.DAY, 1);
					index++;
				}
			}
		},
		renderEvents: function(){
    		var ms = this._mevents = {};
    		
			MonthBoardWidget.superclass.renderEvents.call(this);
			
			var TM = this._TM, TId = this._TId, 
				cd = new Date(this._fromDate),
				index = 0;

			for (var i=0;i<=5;i++){
				for(var ii=0;ii<7;ii++){
					var el = Dom.get(TId['mdtday']['id']+'-'+i+'_'+ii),
						lst = "",
						key = NS.dateToKey(cd);
					
					if (ms[key]){
						lst = TM.replace('mevents', {
							'id': index,
							'count':ms[key].length
						});
					}
					el.innerHTML = lst;
					
					cd = YDate.add(cd, YDate.DAY, 1);
					index++;
				}
			}
    	},
    	
    	renderEvent: function(type, event){
    		var ms = this._mevents, key = NS.dateToKey(event.bDate);
    		if (!ms[key]){ ms[key] = []; }
    		ms[key][ms[key].length] = event;
    		return null;
    	},
    	onClick: function(el){
    		var TId = this._TId;
    		
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (TId['mevents']['id']+'-'):
				var date = YDate.add(this._fromDate, YDate.DAY, numid*1);
				this.onEventsDayClick(date);
				return true;
			}

			return false;
    	},
    	
    	onEventsDayClick: function(date){
    		this.eventsDayClickEvent.fire(date);
    	}
	});
	NS.MonthBoardWidget = MonthBoardWidget;
};