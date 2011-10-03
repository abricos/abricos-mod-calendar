/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[
		{name: 'calendar', files: ['lib.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace, 
		TMG = this.template,
		API = NS.API;

	var YDate = YAHOO.widget.DateMath;

	var initCSS = false,
		buildTemplate = function(w, ts){
		if (!initCSS){
			Brick.util.CSS.update(Brick.util.CSS['calendar']['dayboard']);
			delete Brick.util.CSS['calendar']['dayboard'];
			initCSS = true;
		}
		w._TM = TMG.build(ts); w._T = w._TM.data; w._TId = w._TM.idManager;
	};	
	
	var DayBoardWidget = function(container){
		DayBoardWidget.superclass.constructor.call(this, container);
	};
	YAHOO.extend(DayBoardWidget, NS.BoardWidget, {
		init: function(container){
			
			buildTemplate(this, 'day,dmarker,dhour');
			var TM = this._TM;
			
			var lstM = '', lstH = '';
			for(var ii=0;ii<24;ii++){ 
				lstM += TM.replace('dmarker');
				lstH += TM.replace('dhour', {'hour': (ii < 10 ? '0'+ii : ii)}); 
			}
			
			container.innerHTML = TM.replace('day', {
				'markers': lstM,
				'hours': lstH
			});
			DayBoardWidget.superclass.init.call(this, container);
		},
		
		setDate: function(date){
			date = new Date(date.setHours(0, 0, 0, 0));
			
			this._fromDate = new Date(date.setHours(0, 0, 0, 0));
			this._endDate = YDate.add(date, YDate.DAY, 1);

			DayBoardWidget.superclass.setDate.call(this, date);
		},
		
		render: function(){
			
			var TM = this._TM, 
				lng = Brick.util.Language.getc('mod.calendar.dict'),
				date = this.date;

			TM.getEl('day.title').innerHTML = 
				lng['week'][date.getDay()]+', '+date.getDate()+'/'+(date.getMonth()+1);
			
			
			var el = TM.getEl('day.flagday');
			if (NS.isCurrentDay(date)){
				Dom.addClass(el, 'today');
			}else{
				Dom.removeClass(el, 'today');
			}
		},
		
    	updateMarker: function(){
    		var TM = this._TM, 
    			d = NS.getDate(),
    			hourDY = NS.BOARD_HEIGHT / 24,
				minDY = hourDY / 60,
				y = d.getHours() * hourDY + d.getMinutes() * minDY ;
			
			Dom.setStyle(TM.getEl('day.markerpoint'), 'top',(y-4)+'px');
			Dom.setStyle(TM.getEl('day.markerline'), 'top', y+'px');
    	},
		
		scrollByTime: function(d){
			d = d || NS.getDate();
			var hour = Math.max(d.getHours() - 4, 0);
			
			this._TM.getEl('day.board').scrollTop = hour * (NS.BOARD_HEIGHT / 24);
		},

    	onClick: function(el, e){
    		
			if (DayBoardWidget.superclass.onClick.call(this, el, e)){ return true; }
    		
			if (el.id == this._TM.getElId('day.col')){
				this.onTimeClick(e);
				return false;
			}
			
			return false;
    	},
    	
    	onTimeClick: function(e){
    		var elCol = this._TM.getEl('day.col'),
				pos = E.getXY(e),
				reg = Dom.getRegion(elCol),
				x = pos[0] - reg.left,
				y = pos[1] - reg.top;
    		
    		
    		var time = this.getTimeByPosition(x, y),
    			bdt = new Date(this._fromDate.setHours(time[0], time[1], 0, 0));
    		
    		this.timeClickEvent.fire(bdt);
    	},
    	
    	getTimeByPosition: function(x, y, notRound){
			var hourDY = NS.BOARD_HEIGHT / 24,
				minDY = hourDY / 60,
				hour = Math.ceil(y / hourDY) - 1,
				minute = Math.ceil((y - hour * hourDY)/minDY);
			
			if (!notRound){
				minute = Math.round(minute*0.1)*10;
				minute = minute < 31 ? 0 : 30;
			}
			return [hour, minute];
    	},
    	
    	renderEvents: function(){
    		this._layoutManager = new NS.EventBWLayoutManager();
			DayBoardWidget.superclass.renderEvents.call(this);
			this._layoutManager.layout();
    	},
    	renderEvent: function(type, event){
    		var elCol = this._TM.getEl('day.tasklist'),
    			widget = new NS.EventBoardWidget(this, elCol, event);

    		this._layoutManager.add(widget);
    		
    		return widget;
    	}
	});
	NS.DayBoardWidget = DayBoardWidget;
};