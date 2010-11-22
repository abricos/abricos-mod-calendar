<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage Calendar
 * @copyright Copyright (C) 2010 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

require_once 'dbquery.php';

class CalendarManager extends ModuleManager {
	
	/**
	 * 
	 * @var CompanyModule
	 */
	public $module = null;
	
	/**
	 * 
	 * @var CMSDatabase
	 */
	public $db = null;
	
	public $user = null;
	public $userid = 0;
	
	public function CalendarManager(CalendarModule $module){
		parent::ModuleManager($module);
		
		$this->module = $module;
		
		$this->user = CMSRegistry::$instance->user;
		$this->userid = $this->user->info['userid'];
		
		CMSRegistry::$instance->user->GetManager();
	}
	
	public function IsAdminRole(){
		return $this->module->permission->CheckAction(CalendarAction::ADMIN) > 0;
	}
	
	public function IsWriteRole(){
		return $this->module->permission->CheckAction(CalendarAction::WRITE) > 0;
	}

	public function PermTaskView($userid){
		if (!$this->IsAdminRole()){
			if (!$this->IsWriteRole()){ return false; }
			if ($userid != $this->userid){
				return false;
			}
		}
		return true;
	}
	
	public function DSProcess($name, $rows){
		switch ($name){
			case 'task':
				foreach ($rows->r as $r){
					if ($r->f == 'a'){ $this->TaskAppend($r->d); }
					if ($r->f == 'u'){ $this->TaskUpdate($r->d); }
					if ($r->f == 'd'){ $this->TaskRemove($r->d->id); }
				}
				break;
		}
	}
	
	public function DSGetData($name, $rows){
		$p = $rows->p;
		switch ($name){
			case 'task':
				return $this->Task($p->taskid);
			case 'tasklist':
				return $this->TaskList($p->bdt, $p->edt, $p->uid); 
			case 'days':
				return $this->Days($p->uid, $p->days); 
		}
		return null;
	}
	
	public function TaskList($datebegin, $dateend, $userid){
		if (!$this->PermTaskView($userid)){ return; }
		return CalendarQuery::TaskList($this->db, $datebegin, $dateend, $userid);
	}
	
	public function Task($taskid){
		$task = CalendarQuery::Task($this->db, $taskid);
		if (!$this->PermTaskView($task['uid'])){ return array(); }
		
		return array($task);
	}
	
	public function TaskAppend($data){
		if (!$this->IsWriteRole()){ return; }
		$data->uid = $this->userid;
		$data->own = 'cdr';
		CalendarQuery::TaskAppend($this->db, $data);
	}
	
	public function TaskUpdate($data){
		if (!$this->IsWriteRole()){ return; }
		$task = CalendarQuery::Task($this->db, $data->id);
		if (!$this->PermTaskView($task['uid'])){ return array(); }
		CalendarQuery::TaskUpdate($this->db, $data);
	}
	
	public function TaskRemove($taskid){
		$task = CalendarQuery::Task($this->db, $taskid);
		if (!$this->PermTaskView($task['uid'])){ return array(); }
		CalendarQuery::TaskRemove($this->db, $taskid);
	}
	
	public function Days($userid, $data){
		if (!$this->PermTaskView($userid)){ return; }
		return CalendarQuery::Days($this->db, $userid, $data);
	}
	
}

?>