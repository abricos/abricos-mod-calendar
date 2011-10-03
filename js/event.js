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
			Brick.util.CSS.update(Brick.util.CSS['calendar']['event']);
			delete Brick.util.CSS['calendar']['event'];
			initCSS = true;
		}
		w._TM = TMG.build(ts); w._T = w._TM.data; w._TId = w._TM.idManager;
	};
	
	var EBWRow = function(event){
		this.ls = [];
		this.add(event);
	};
	EBWRow.prototype = {
		add: function(evt){
			if (this.find(evt)){ return; }
			this.ls[this.ls.length] = evt;
		},
		evin: function(ev1, ev2){
			if (ev1.id == ev2.id){ return false; }
			
			var b1 = ev1.bDate, b2 = ev2.bDate,
				e1 = ev1.eDate, e2 = ev2.eDate;
			
			if (b1 <= b2 && e1 > b2){
				return true;
			}
			return false;
		},
		check: function(event){
			var ls = this.ls;
			for (var i=0; i<ls.length; i++){
				if (this.evin(event, ls[i])){
					this.add(event);
					return true;
				}
			}
			return false;
		},
		foreach: function(f){
			var ls = this.ls;
			for (var i=0;i<ls.length;i++){
				if (f(ls[i])){ return; }
			}
		},
		count: function(){ return this.ls.length; },
		find: function(event){
			var ls=this.ls;
			for (var i=0;i<ls.length;i++){
				if (event.id == ls[i].id){
					return true;
				}
			}
			return false;
		},
		compare: function(rows){
			if (this.count() != rows.count()){ return false; }
			for (var i=0;i<this.ls.length;i++){
				var find = false;
				for (var ii=0;ii<rows.ls.length;ii++){
					if (this.ls[i].id == rows.ls[ii].id){
						find = true;
					}
				}
				if (!find){ return false; }
			}
			return true;
		}
	};

	
	var EventBWLayoutManager = function(){
		this.init();
	};
	EventBWLayoutManager.prototype = {
		init: function(){
			this.list = [];
		},
		add: function(w){
			this.list[this.list.length] = w;
		},
		layout: function(){ // разложить
			
			var rows = [],
				lst = this.list.sort(function(w1, w2){
				if (w1.event.bDate < w2.event.bDate){ return -1; }
				if (w1.event.bDate > w2.event.bDate){ return 1; }
				return 0;
			});
			
			var wss = {};
			
			for (var i=0; i<lst.length; i++){
				var evt = lst[i].event,
					row = new EBWRow(evt);
				
				wss[evt.id] = lst[i];
				
				for (var ii=0; ii<lst.length; ii++){
					row.check(lst[ii].event); // все кто есть в этом ряду, будут добавлены 
				}
				
				if (row.count() > 1){
					rows[rows.length] = row;
				}
			}
			var nrows = [];
			for (var i=0; i<rows.length; i++){
				
				var row = rows[i], comp = false;
				for (var ii=0;ii<nrows.length;ii++){
					if (row.compare(nrows[ii])){
						comp = true;
					}
				}
				if (!comp){
					nrows[nrows.length] = row;
				}
			}
			rows = nrows;
			
			for (var ii=0; ii<rows.length; ii++){
				var j=1, row = rows[ii];
				row.foreach(function(evt){
					wss[evt.id].setMultiPos(j++, row.count());
				});
			}
				
			for (var i=0;i<lst.length;i++){
				lst[i].show();
			}			
		}
	};
	NS.EventBWLayoutManager = EventBWLayoutManager;
	
	var EventBoardWidget = function(owner, container, event, style){
		style = L.merge({
			'title': '41, 82, 163',
			'body': '102, 140, 217'
		}, style || {});
		this.init(owner, container, event, style);
	};
	EventBoardWidget.prototype = {
		init: function(owner, container, event, style){
			this.owner = owner;
			this.event = event;
			
			buildTemplate(this, 'widget');
			
			var div = document.createElement('div');
			div.innerHTML = this._TM.replace('widget', {
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
				if (el.id == TId['widget']['id']){
					this.owner.onEventWidgetClick(this);
					return true;
				}
				el = el.parentNode;
			}
			return false;
		},
		destroy: function(){ this.el.parentNode.removeChild(this.el); },
		isShow: function(){ return Dom.getStyle(this.el, 'display')  == ''; },
		show: function(){ Dom.setStyle(this.el, 'display', ''); },
		hide: function(){ Dom.setStyle(this.el, 'display', 'none'); },
		render: function(){
			var event = this.event, 
				el = this.el,
    			hourDY = NS.BOARD_HEIGHT / 24,
				minDY = hourDY / 60,
				bdt = event.bDate,
				edt = event.eDate;

			var y = bdt.getHours() * hourDY + bdt.getMinutes() * minDY;
			var y1 = edt.getHours() * hourDY + edt.getMinutes() * minDY ;
			var h = Math.max(y1 - y -3, 25);

			Dom.setStyle(el, 'top', y+'px');
			Dom.setStyle(el.childNodes[0], 'height', h+'px');
			Dom.setStyle(el, 'left', 0+'%');
			Dom.setStyle(el, 'width', 100+'%');

			var TM = this._TM;
			TM.getEl('widget.tl').innerHTML = event.title;
			TM.getEl('widget.tm').innerHTML = NS.dateToTime(bdt)+' - '+NS.dateToTime(edt);
			this.updateActualy();
		},
		setMultiPos: function(nc, cntc){
			cntc = Math.max(cntc, 1);
			nc = Math.min(nc, cntc);
			var el = this.el,
				w = Math.floor(100/cntc);
			
			Dom.setStyle(el, 'left', w*(cntc-nc)+'%');
			Dom.setStyle(el, 'width', w+'%');
		},
		updateActualy: function(){
			if (this.event.eDate.getTime() < (NS.getDate()).getTime()){
				Dom.setStyle(this.el, 'opacity', 0.5);
			}
		}
	};
	NS.EventBoardWidget = EventBoardWidget;
	
	var EventNewEditPanel = function(date){
		this.bDate = date;
		EventNewEditPanel.superclass.constructor.call(this, {
			fixedcenter: true, overflow: false, resize: false, modal: true
		});
	};
	YAHOO.extend(EventNewEditPanel, Brick.widget.Dialog, {
		initTemplate: function(){
			buildTemplate(this, 'eventnew,menuitem,wcont');
			return this._TM.replace('eventnew');
		},
		onLoad: function(){
			var etm = NS.eventTypeManager,
				TM = this._TM, TId = this._TId, 
				mns = [], lst = "";
			
			etm.foreach(function(et){
				mns[mns.length] = TM.replace('menuitem', {
					'tl': et.title,
					'id': et.id
				});
				lst += TM.replace('wcont', {
					'id': et.id
				});
			});
			TM.getEl('eventnew.menutypes').innerHTML = mns;
			TM.getEl('eventnew.list').innerHTML = lst;
			
			var bdt = this.bDate;
			
			var eventnew = new NS.Event();
			eventnew.bDate = bdt;
			eventnew.eDate = new Date(bdt.getTime()+1000*60*60);
			
			var editors = {};
			etm.foreach(function(et){
				var container = Dom.get(TId['wcont']['id']+'-'+et.id);
				editors[et.id] = new et['editor'](container, eventnew);
			});
			this.editors = editors;
			
			this.selectPageById(1);
		},
		selectPageById: function(etid){
			
			this._selectedEditorId = etid; 
			var etm = NS.eventTypeManager, TId = this._TId;
			
			etm.foreach(function(et){
				var container = Dom.get(TId['wcont']['id']+'-'+et.id);
				Dom.setStyle(container, 'display', et.id == etid ? '' : 'none');
			});
		},
		getSelectedEditor: function(){
			return this.editors[this._selectedEditorId];
		},
		onClick: function(el){
			
			var tp = this._TId['eventnew'];
			switch(el.id){
			case tp['bcreate']: this.saveEvent(); return true;
			case tp['bcancel']: this.close(); return true;
			}
			
			return false;
		},
		saveEvent: function(){
			var editor = this.getSelectedEditor(),
				event = editor.buildEvent();
			
			if (L.isNull(event)){ return; }
			
			var sd = event.getSaveData(),
				__self = this;
			
			NS.calendarManager.eventSave(event.owner, event.tname, sd, function(){
				__self.close();
			});
		}
	});
	NS.EventNewEditPanel = EventNewEditPanel;
	
	var EventEditorPanel = function(event){
		this.event = event;
		EventEditorPanel.superclass.constructor.call(this, {
			fixedcenter: true, overflow: false, resize: false, modal: true
		});
	};
	YAHOO.extend(EventEditorPanel, Brick.widget.Dialog, {
		initTemplate: function(){
			buildTemplate(this, 'edpanel');
			return this._TM.replace('edpanel');
		},
		onLoad: function(){
			var TM = this._TM,
				event = this.event;
			
			var et = NS.eventTypeManager.get(event.owner, event.tname);
			this.editor = new et['editor'](TM.getEl('edpanel.widget'), event);
		},
		onClick: function(el){
			
			var tp = this._TId['edpanel'];
			switch(el.id){
			case tp['bremove']: this.removeEvent(); return true;
			case tp['bcreate']: this.saveEvent(); return true;
			case tp['bcancel']: this.close(); return true;
			}
			
			return false;
		},
		saveEvent: function(){
			var event = this.editor.buildEvent();
			
			if (L.isNull(event)){ return; }
			
			var sd = event.getSaveData(),
				__self = this;
			
			NS.calendarManager.eventSave(event.owner, event.tname, sd, function(){
				__self.close();
			});
		},
		removeEvent: function(){
			var __self = this, evt = this.event;
			
			NS.calendarManager.eventRemove(evt.owner, evt.tname, evt.id, function(){
				__self.close();
			});
		}
	});
	NS.EventEditorPanel = EventEditorPanel;

};