/*
* @version $Id: calendar_plugin.js 621 2010-07-30 11:42:15Z roosit $
* @copyright Copyright (C) 2008 Abricos. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	yahoo: ['json'],
	mod:[
		// {name: 'company', files: ['api.js','employee.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace,
		TMG = this.template,
		API = NS.API;
	
	if (!NS.data){
		NS.data = new Brick.util.data.byid.DataSet('calendar');
	}
	var DATA = NS.data;
	
	var buildTemplate = function(w, templates){
		var TM = TMG.build(templates), T = TM.data, TId = TM.idManager;
		w._TM = TM; w._T = T; w._TId = TId;
	};


	var shortFIO = function(di){
		var str = di['elnm'];
		
		if (di['efnm'].length > 0){
			str += ' '+di['efnm'].substr(0, 1).toUpperCase() + '.';
		}
		if (di['epnc'].length > 0){
			str += ' '+di['epnc'].substr(0, 1).toUpperCase() + '.';
		}
		return str;
	};
	
	var clrs = [];
	clrs[clrs.length] = {'title': '41, 82, 163', 'body': '102, 140, 217'};
	clrs[clrs.length] = {'title': '163, 41, 41', 'body': '217, 102, 102'};
	clrs[clrs.length] = {'title': '40, 117, 78', 'body': '101, 173, 137'};
	clrs[clrs.length] = {'title': '134, 90, 90', 'body': '190, 148, 148'};
	clrs[clrs.length] = {'title': '177, 54, 95', 'body': '230, 115, 153'};
	clrs[clrs.length] = {'title': '13, 120, 19', 'body': '76, 176, 82'};
	clrs[clrs.length] = {'title': '112, 87, 112', 'body': '169, 146, 169'};
	clrs[clrs.length] = {'title': '122, 54, 122', 'body': '179, 115, 179'};
	clrs[clrs.length] = {'title': '82, 136, 0', 'body': '140, 191, 64'};
	clrs[clrs.length] = {'title': '78, 93, 108', 'body': '140, 102, 217'};
	
	clrs[clrs.length] = {'title': '82, 41, 163', 'body': '102, 140, 217'};
	clrs[clrs.length] = {'title': '41, 82, 163', 'body': '102, 140, 217'};
	clrs[clrs.length] = {'title': '41, 82, 163', 'body': '102, 140, 217'};
	clrs[clrs.length] = {'title': '41, 82, 163', 'body': '102, 140, 217'};
	clrs[clrs.length] = {'title': '41, 82, 163', 'body': '102, 140, 217'};
	clrs[clrs.length] = {'title': '41, 82, 163', 'body': '102, 140, 217'};
	clrs[clrs.length] = {'title': '41, 82, 163', 'body': '102, 140, 217'};

	var TASK_COLORS = clrs;	

	
	var UserListWidget = function(container, owner){
		this.init(container, owner);
	};
	UserListWidget.prototype = {
		_isInitElements: false,
		employee: null,
		employees: [],
		taskcolors: {},

		init: function(container, owner){
			this.calendarWidget = owner;
			
			buildTemplate(this, 'manager,table,row,myrow');
			container.innerHTML = this._T['manager'];
			
			// this.tables = new Brick.mod.sys.TablesManager(NS.data, ['users'], {'owner': this});
			
			
			/*
			
			var tables = {
				'employeelist': DATA.get('employeelist', true),
				'employee': DATA.get('employee', true),
				'calperm': DATA.get('calperm', true),
				'userconfig': DATA.get('userconfig', true)
			};
			DATA.get('employee').getRows({userid: Brick.env.user.id});
			DATA.get('calperm').getRows({userid: Brick.env.user.id});
			
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			if (DATA.isFill(tables)){
				this.render();
			}
			/**/
		},
		onDataLoadWait: function(tables){ },
		onDataLoadComplete: function(tables){
		},
		onDSUpdate: function(type, args){
			if (!args[0].checkWithParam('calperm', {userid: Brick.env.user.id})){ return;}
			this.render();
		},
		destroy: function(){
			// this.tables.destroy();
		},
		_initElements: function(){
			var row = DATA.get('employee').getRows({userid: Brick.env.user.id}).getByIndex(0);
			if (row.cell['isemp']*1 == 0){ 
				// Пользователь не является сотрудником 
				return; 
			}
			
			this.employee = row.cell;
			
			var div = document.createElement('div');

			this.calendarWidget.elPlugins.appendChild(div);
			var calW = this.calendarWidget;
			
			var __self = this;
			E.on(div, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});
			div.innerHTML = this._T['manager'];

			this.calendarWidget.getUsers = function(){
				return __self.getUsers();
			};
			
			this.calendarWidget.getTaskColor = function(userid){
				var clr = __self.getTaskColor(userid);
				return clr;
			};
			
			var oldShowTask = this.calendarWidget.showTask;
			this.calendarWidget.showTask = function(task){
				var taskEditor = oldShowTask(task,
					function(){
						calW.refresh(true);
					}
				);
			};
			
			var oldCreateTask = this.calendarWidget.createTask;
			this.calendarWidget.createTask = function(bdate, edate){
				var taskEditor = oldCreateTask(bdate, edate,
					function(){
						calW.refresh(true);
					}
				);
				var emp = __self.employee;
				if (L.isNull(emp)){ return; }
			};
			
			_overrideCalClasses();
		},
		
		_getConfig: function(){
			var cfg = {
				ch: []
			};
			if (L.isNull(this.employee)){ return cfg; }
			cfg.ch = [this.employee.id*1];
			var row = DATA.get('calperm').getRows({userid: Brick.env.user.id}).getByIndex(0);
			if (row.cell['isemp']*1 == 0){ return cfg; }
			if (row.cell['ops']){
				cfg = YAHOO.lang.JSON.parse(row.cell['ops']);
			}
			return cfg;
		},
		
		_updateConfig: function(){
			var users = this.getUsers(true);
			var cfg = this._getConfig();
			cfg['ch'] = users;
			var row = DATA.get('calperm').getRows({userid: Brick.env.user.id}).getByIndex(0);
			row.update({
				'ops': YAHOO.lang.JSON.stringify(cfg)
			});
			row.cell['cin'] = null;
			row.cell['cout'] = null;
			row.cell['act'] = 'cfg';
			DATA.get('calperm').applyChanges();
		},
		
		render: function(){
			if (!this._isInitElements){
				this._isInitElements = true;
				this._initElements(); 
			}

			if (L.isNull(this.employee)){ return; }
			
			var TM = this._TM, T = this._T;
			var lst = "";
			
			var clrindex = 0; 			
			var clrs = {};
			var curclr = clrs[Brick.env.user.id] = TASK_COLORS[clrindex++];
			
			lst += TM.replace('myrow', {
				'fio': shortFIO(this.employee),
				'clrbody': curclr['body'], 
				'clrtitle': curclr['title'] 
			});
			
			var emps = [];
			
			var row = DATA.get('calperm').getRows({userid: Brick.env.user.id}).getByIndex(0);
			var acin = !L.isNull(row.cell['cin']) ? row.cell['cin'].split(',') : '';
			var cfg = this._getConfig();
			var ids = {};
			for (var i=0;i<acin.length;i++){
				ids[acin[i].replace('#', '')] = true;
			};
			
			DATA.get('employeelist').getRows().foreach(function(row){
				if (!ids[row.cell.id]){ return; }

				var di = row.cell;
				emps[emps.length] = di;
				clrs[di.uid] = TASK_COLORS[clrindex++];
				lst += TM.replace('row', {
					'id': di['id'],
					'fio': shortFIO(di),
					'clrbody': clrs[di.uid]['body'], 
					'clrtitle': clrs[di.uid]['title'] 
				});
			});
			
			TM.getEl('manager.table').innerHTML = TM.replace('table', { 'rows': lst });
			
			this.employees = emps;
			this.taskcolors = clrs;
			
			this.setUsers(cfg['ch']);
			this.calendarWidget.refresh();
		},
		
		getTaskColor: function(userid){
			var clr = this.taskcolors[userid];
			if (!clr){
				return TASK_COLORS[0];
			}
			return clr;
		},
		
		setUsers: function(empids){
			empids = empids || [];
			var emps = this.employees;
			var elCH; 
			
			for (var i=0;i<empids.length;i++){
				var empid = empids[i]*1;
				if (empid == this.employee.id*1){
					elCH = this._TM.getEl('myrow.id');
				}else{
					elCH = Dom.get(this._TId['row']['id']+'ch-'+empid);
				}
				if (!L.isNull(elCH)){
					elCH.checked = true;
				}
			}
		},
		
		getUsers: function(retEmpIds){
			retEmpIds = retEmpIds || false;
			if (L.isNull(this.employee)){
				return [Brick.env.user.id];
			}
			
			var users = [];
			if (this._TM.getEl('myrow.id').checked){
				users[users.length] = retEmpIds ? this.employee.id : Brick.env.user.id;
			}
			
			var emps = this.employees;
			for (var i=0;i<emps.length;i++){
				var emp = emps[i];
				if (Dom.get(this._TId['row']['id']+'ch-'+emp['id']).checked){
					users[users.length] = emp[retEmpIds ? 'id' : 'uid']*1;
				}
			}
			
			return users;
		},

		onClick: function(el){
			var TId = this._TId;
			var tp = TId['manager']; 
			switch(el.id){
			case tp['bconfig']: this.showConfigPanel(); return true;
			case tp['bselall']: this.selectAll(); return true;
			case tp['bunselall']: this.unSelectAll(); return true;
			case TId['myrow']['id']: this.changeOptions(); return false;
			}
			
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case TId['row']['id']+'ch-':
				this.changeOptions();
				return false;
			}
			
			return false;
		},
		showConfigPanel: function(){
			new NS.ConfigPanel(this.employee);
		},
		
		changeOptions: function(){
			this._updateConfig();
			this.calendarWidget.refresh();
		},
		
		_selectItems: function(flag){
			var TM = this._TM;
			TM.getEl('myrow.id').checked = flag;
			
			var emps = this.employees;
			for (var i=0;i<emps.length;i++){
				var emp = emps[i];
				Dom.get(this._TId['row']['id']+'ch-'+emp['id']).checked = flag;
			}
		},

		selectAll: function(){
			this._selectItems(true);
			this.changeOptions();
		},
		
		unSelectAll: function(){
			this._selectItems(false);
			this.changeOptions();
		}
	};
	NS.UserListWidget = UserListWidget;
	


};
