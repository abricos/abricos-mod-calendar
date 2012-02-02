/*
@version $Id$
@copyright Copyright (C) 2011 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[
			{name: 'widget', files: ['calendar.js']},
		]
};
Component.entryPoint = function(NS){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var WNS = Brick.mod.widget,
		CNS = Brick.mod.calendar;
	
	var  buildTemplate = this.buildTemplate;
	
	var DefaultEvent = function(d){
		d = L.merge({
			'own': 'calendar',
			'bd': ''
		}, d || {});
		DefaultEvent.superclass.constructor.call(this, d);
	};
	YAHOO.extend(DefaultEvent, NS.Event, {
		update: function(d){
			DefaultEvent.superclass.update.call(this, d);
			this.descript = d['bd'];
		},
		getSaveData: function(){
			var sd = DefaultEvent.superclass.getSaveData.call(this);
			sd['bd'] = this.descript;
			return sd;
		}
	});
	NS.DefaultEvent = DefaultEvent;
	
	var DefaultEventEditorWidget = function(container, event){
		if (event.id*1 == 0){ 
			event = new DefaultEvent(event.getSaveData()); 
		}
		DefaultEventEditorWidget.superclass.constructor.call(this, container, event);
	};
	YAHOO.extend(DefaultEventEditorWidget, NS.EventEditorWidget, {
		init: function(container, event){
			DefaultEventEditorWidget.superclass.init.call(this, container, event);

			buildTemplate(this, 'widget');

			var TM = this._TM;
			container.innerHTML = TM.replace('widget');

			TM.getEl('widget.title').value = event.title;
			TM.getEl('widget.desc').value = event.descript;

			this.bdtWidget = new WNS.DateInputWidget(TM.getEl('widget.bdate'), {
				'date': event.bDate,
				'showTime': true,
				'showBClear': false,
				'showBTime': false
			});
			
			this.edtWidget = new WNS.DateInputWidget(TM.getEl('widget.edate'), {
				'date': event.eDate,
				'showTime': true,
				'showBClear': false,
				'showBTime': false
			});
		},
		buildEvent: function(){
			var TM = this._TM,
				cevt = this.event,
				bdt = NS.dateClientToServer(this.bdtWidget.getValue()),
				edt = NS.dateClientToServer(this.edtWidget.getValue());
			
			if (bdt > edt){ return null; }
			
			var event = new DefaultEvent({
				'id': cevt.id,
				'bdt': bdt,
				'edt': edt,
				'tl': TM.getEl('widget.title').value,
				'bd': TM.getEl('widget.desc').value
			});
			return event;
		}
	});
	NS.DefaultEventEditorWidget = DefaultEventEditorWidget;

	var defEvent = new CNS.EventType({
		'owner': 'calendar',
		'tname': '',
		'title': Brick.util.Language.getc('mod.calendar.event.default.title'),
		'editor': NS.DefaultEventEditorWidget,
		'event': NS.DefaultEvent
	});
	CNS.eventTypeManager.register(defEvent);
	
};
