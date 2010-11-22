/*
@version $Id$
@copyright Copyright (C) 2008 Abricos. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[
		{name: 'sys', files: ['data.js', 'form.js', 'container.js']},
		{name: 'calendar', files: ['lib.js', 'roles.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace,
		TMG = this.template;
	
	var API = NS.API;
	var YDate = YAHOO.widget.DateMath;
	
	if (!NS.data){
		NS.data = new Brick.util.data.byid.DataSet('calendar');
	}
	
	var TN = {
		'widget': 'dtwidget',
		'date': 'dtwidget.date',
		'time': 'dtwidget.time',
		'datecont': 'dtwidget.datecont'
	}; 
	
	var DateTimeWidget = function(container, date){
		date = date || NS.getDate();
		this.init(container, date);
	};
	
	DateTimeWidget.prototype = {
		el: function(name){ return Dom.get(this._TId[TN['widget']][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		init: function(container, date){
			this.date = date;

			var TM = TMG.build(TN['widget']), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			container.innerHTML = T[TN['widget']];
			this.setDateTime(this.date);
		},
		setDateTime: function(date){
			this.setDay(date);
			this.setTime(date);
		},
		setDay: function(date){
			var day = date.getDate();
			var month = date.getMonth()+1;
			var year = date.getFullYear();
			this._TM.getEl(TN['date']).value = NS.lz(day)+"/"+NS.lz(month)+'/'+year;
		},
		setTime: function(date){
			var hour = date.getHours();
			var min = date.getMinutes();
			this._TM.getEl(TN['time']).value = NS.lz(hour)+":"+NS.lz(min);
		},
		
		checkDate: function(){
			var re = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
			
			var sD = this.elv('date');
			if (!sD.match(re)){
				return 1;
			}
			re = /^\d{1,2}:\d{2}([ap]m)?$/; 
			var sT = this.elv('time');
			if (!sT.match(re)){
				return 2;
			}
			return 0;
		},
		
		getDate: function(){
			
			var sD = this.elv('date');
			var aD = sD.split('/');
			
			var sT = this.elv('time');
			var aT = sT.split(':');

			return new Date(aD[2], aD[1]*1-1, aD[0], aT[0], aT[1], 0);
		}
	};
	
	NS.DateTimeWidget = DateTimeWidget;
	
	var TaskEditPanel = function(task, callback, config){
		
		this.task = task;
		this.callback = callback;
		
		config = L.merge({
			// width: "550px", height: "400px",
			fixedcenter: true,
			overflow: false, resize: false, modal: true
		}, config || {});
		
		TaskEditPanel.superclass.constructor.call(this, config);
	};
	
	YAHOO.extend(TaskEditPanel, Brick.widget.Panel, {
		initTemplate: function(){
			var TM = TMG.build('panel'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;

			return this._T['panel'];
		},
		onLoad: function(){
			
			var TM = this._TM, TId = this._TId;
			var __self = this;
			NS.TaskEditWidget.prototype.startDataLoadEvent = function(){
				__self.actionDisable(TId['panel']['bcancel']);
			};
			NS.TaskEditWidget.prototype.completeDataLoadEvent = function(){
				__self.actionEnable();
			};
			this.taskWidget = new NS.TaskEditWidget(this._TM.getEl('panel.container'), this.task);
			var task = this.task = this.taskWidget.task;
			
			var elBSave = TM.getEl('panel.bsave'),
				elBRemove = TM.getEl('panel.bremove'),
				elBCreate = TM.getEl('panel.bcreate'),
				elBCancel = TM.getEl('panel.bcancel'),
				elBClose = TM.getEl('panel.bclose');
			
			elBSave.style.display = 'none';
			elBRemove.style.display = 'none';
			elBCreate.style.display = 'none';
			elBCancel.style.display = 'none';
			elBClose.style.display = 'none';
			
			if (task.id == 0){
				elBCreate.style.display = '';
				elBCancel.style.display = '';
			}else if (task.uid == Brick.env.user.id){
				elBSave.style.display = '';
				elBRemove.style.display = '';
				elBCancel.style.display = '';
			}else{
				elBClose.style.display = '';
			}
		},
		onClose: function(){
			this.taskWidget.destroy();
		},
		onClick: function(el){
			if (this.taskWidget.onClick(el)){ return true; }
			
			var tp = this._TId['panel'];
			switch(el.id){
			case tp['bcancel']: 
			case tp['bclose']: this.close(); return true;
			case tp['bcreate']:
			case tp['bsave']: this.save(); return true;
			case tp['bremove']: this.remove(); return true;
			}
		},
		remove: function(){
			var table = NS.data.get('task');
			var rows = table.getRows({taskid: this.task.id});
			var row = rows.getByIndex(0);
			
			var __self = this;
			new NS.TaskRemovePanel(row.cell['tl'], function(){
				row.remove();
				table.applyChanges();
				__self.close();
				__self.callback();
			});
		},
		save: function(){
			if (!this.taskWidget.save()){
				return;
			}
			this.close();
			this.callback();
		}
	});
	NS.TaskEditPanel = TaskEditPanel;
	
	var TaskEditWidget = function(container, task){
		this.init(container, task);
	};
	TaskEditWidget.prototype = {
		el: function(name){ return Dom.get(this._TId['widget'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		
		initTemlate: function(){
			var TM = TMG.build('widget'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			return T['widget'];
		},
		
		init: function(container, task){
			task = L.merge({
				id: 0,
				calc: {
					bdt: NS.getDate(),
					edt: NS.getDate()
				}
			}, task || {});
			this.task = task;
			
			this.initElements(container);
			
			if (task.id == 0){
				this.renderElements();
				return; 
			}
			
			this.initTables();
			NS.data.onComplete.subscribe(this.onDSUpdate, this, true);
			if (NS.data.isFill(this.tables)){
				this.renderElements();
			}else{
				this.renderAwaitElements();
				this.startDataLoadEvent();
				NS.data.request();
			}
		},
		initElements: function(container){
			container.innerHTML = this.initTemlate(); 
			
			this.beginDate = new DateTimeWidget(this.el('bdate'), this.task.calc.bdt); 
			this.endDate = new DateTimeWidget(this.el('edate'), this.task.calc.edt);
		},
		startDataLoadEvent: function(){},
		completeDataLoadEvent: function(){},
		initTables: function(){
			NS.data.get('task', true).getRows({taskid: this.task.id});
		},
		onDSUpdate: function(type, args){
			if (!args[0].checkWithParam('task', {taskid: this.task.id})){ return; }
			this.completeDataLoadEvent();
			this.renderElements(); 
		},
		destroy: function(){
			NS.data.onComplete.unsubscribe(this.onDSUpdate, this);
		},
		renderAwaitElements: function(){ },
		renderElements: function(){
			
			if (this.task.id == 0){
				this.updateElements(null);
			}else{
				var row = NS.data.get('task').getRows({taskid: this.task.id}).getByIndex(0);
				this.updateElements(row);
			}
		},
		updateElements: function(row){
			if (L.isNull(row)){ return; }
			var di = row.cell; 
			this.setelv('title', di['tl']);
			this.setelv('desc', di['dsc']);
		},
		updateRow: function(row){
			row.update({
				'tl': this.elv('title'),
				'dsc': this.elv('desc'),
				'bdt': NS.dateClientToServer(this.beginDate.getDate()),
				'edt': NS.dateClientToServer(this.endDate.getDate())
			});
		},
		
		checkForm: function(){
			// check form
			var err = 0;
			var lng = Brick.util.Language.getc('mod.calendar.error');
			if ((err = this.beginDate.checkDate()) > 0){
				alert(lng[err]);
				return false;
			}
			if ((err = this.endDate.checkDate()) > 0){
				alert(lng[err]);
				return false;
			}
			var bdt = this.beginDate.getDate();
			var edt = this.endDate.getDate();
			if (bdt.getTime() >= edt.getTime() || bdt.getDate() != edt.getDate()){
				alert(lng[3]);
				return false;
			}
			return true;
		},
		save: function(){

			if (!this.checkForm()){
				return false;
			}
			
			this.initTables();
			var table = NS.data.get('task');
			var rows = table.getRows({taskid: this.task.id});
			var row = this.task.id > 0 ? rows.getByIndex(0) : table.newRow();

			this.updateRow(row);
			
			if (row.isNew()){
				rows.add(row);
			}
			table.applyChanges();
			return true;
		},
		onClick: function(el){
			return false;
		}
	};

	NS.TaskEditWidget = TaskEditWidget;
	
	var TM = TMG.build('removepanel'), T = TM.data, TId = TM.idManager;
	var TaskRemovePanel = function(filename, callback){
		this.filename = filename;
		this.callback = callback;
		
		TaskRemovePanel.superclass.constructor.call(this, {
			width: '400px', modal: true, fixedcenter: true
		});
	};
	YAHOO.extend(TaskRemovePanel, Brick.widget.Panel, {
		initTemplate: function(){
			return TM.replace('removepanel', {
				'nm': this.filename
			});
		},
		onClick: function(el){
			if (el.id == TM.getElId('removepanel.bremove')){
				this.close();
				this.callback();
				return true;
			}else if (el.id == TM.getElId('removepanel.bcancel')){
				this.close();
			}
			return false;
		}
	});
	NS.TaskRemovePanel = TaskRemovePanel;
	
};
