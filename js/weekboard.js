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
			Brick.util.CSS.update(Brick.util.CSS['calendar']['weekboard']);
			delete Brick.util.CSS['calendar']['weekboard'];
			initCSS = true;
		}
		w._TM = TMG.build(ts); w._T = w._TM.data; w._TId = w._TM.idManager;
	};

	
	var WeekBoardWidget = function(container){
		WeekBoardWidget.superclass.constructor.call(this, container);
	};
	YAHOO.extend(WeekBoardWidget, NS.BoardWidget, {
		init: function(container){
			
			buildTemplate(this, 'week,wdtlrow,wmarker,whour,wcol');
			var TM = this._TM;
			
			container.innerHTML = TM.replace('week', {
				'tlrows': function(){
					var s = '';
					for(var ii=0;ii<7;ii++){ 
						s += TM.replace('wdtlrow',{'id': ii}); 
					}
					return s;
				}(),
				'markers': function(){
					var s = '';
					for(var ii=0;ii<24;ii++){ s += TM.replace('wmarker'); }
					return s;
				}(),
				'hours': function(){
					var s = '';
					for(var ii=0;ii<24;ii++){ 
						s += TM.replace('whour', {'hour': (ii < 10 ? '0'+ii : ii)}); 
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
			WeekBoardWidget.superclass.init.call(this, container);
		},
		
		setDate: function(date){
			date = new Date(date.setHours(0, 0, 0, 0));

			this._fromDate = YDate.getFirstDayOfWeek(date, 1);
			this._endDate = YDate.add(this._fromDate, YDate.DAY, 7);
			
			WeekBoardWidget.superclass.setDate.call(this, date);
		},
		
		render: function(){
			var TId = this._TId,
				lng = Brick.util.Language.getc('mod.calendar.dict');

			for (var i=0;i<7;i++){
				var dt = YDate.add(this._fromDate, YDate.DAY, i),
					elCol = Dom.get(TId['wdtlrow']['tl']+'-'+i),
					elColToday = Dom.get(TId['wcol']['today']+'-'+i),
					elColMarker = Dom.get(TId['wcol']['markercol']+'-'+i);
				
				elCol.innerHTML = lng['week']['short'][dt.getDay()]+', '+dt.getDate()+'/'+(dt.getMonth()+1);
				
				if (NS.isCurrentDay(dt)){
					elColToday.style.display = '';
					elColMarker.style.display = ''; 
				}else{
					elColToday.style.display = 'none';
					elColMarker.style.display = 'none'; 
				}
			}
		},

    	updateMarker: function(){
    		var TM = this._TM, TId = this._TId, 
    			d = NS.getDate(),
    			hourDY = NS.BOARD_HEIGHT / 24,
				minDY = hourDY / 60,
				y = d.getHours() * hourDY + d.getMinutes() * minDY ;
    		
			for (var i=0;i<7;i++){
				var elColMarker = Dom.get(TId['wcol']['markercol']+'-'+i);
				Dom.setStyle(elColMarker, 'top', y+'px');
			}
			
			Dom.setStyle(TM.getEl('week.markerpoint'), 'top',(y-4)+'px');
    	},

		scrollByTime: function(d){
			d = d || NS.getDate();
			var hour = Math.max(d.getHours() - 4, 0),
				hourDY = NS.BOARD_HEIGHT / 24;
			this._TM.getEl('week.board').scrollTop = hourDY * hour;
		},
    	
    	onClick: function(el, e){
    		
			if (WeekBoardWidget.superclass.onClick.call(this, el, e)){ return true; }

    		var TId = this._TId,
				prefix = el.id.replace(/([0-9]+$)/, ''),
				numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (TId['wcol']['id']+'-'):
				this.onTimeClick(e, numid);
				return true;
			}
			
			return false;
    	},
    	
    	onTimeClick: function(e, numCol){
    		var elCol = Dom.get(this._TId['wcol']['id']+'-'+numCol), 
				pos = E.getXY(e),
				reg = Dom.getRegion(elCol),
				x = pos[0] - reg.left,
				y = pos[1] - reg.top;
    		
    		var time = this.getTimeByPosition(x, y),
    			dt = YDate.add(this._fromDate, YDate.DAY, numCol*1),
    			bdt = new Date(dt.setHours(time[0], time[1], 0, 0));
    		
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
    	
    	getDayOfWeek: function(d) {
    		D = d.getDay();
		    if(D == 0) D = 7;
		    return D;
    	},
    	
    	renderEvents: function(){
    		this._wcols = {};
    		
			WeekBoardWidget.superclass.renderEvents.call(this);

			for (var n in this._wcols){
				this._wcols[n].layout();
			}
    	},
   	
    	renderEvent: function(type, event){
    		var wn = this.getDayOfWeek(event.bDate),
    			elCol = Dom.get(this._TId['wcol']['tasklist']+'-'+(wn-1)),
    			widget = new NS.EventBoardWidget(this, elCol, event);

    		var wc = this._wcols;
    		if (!wc[wn]){ wc[wn] = new NS.EventBWLayoutManager(); }
    		wc[wn].add(widget);
    		
    		return widget;
    	}
    	
    });
	NS.WeekBoardWidget = WeekBoardWidget;	
	

};