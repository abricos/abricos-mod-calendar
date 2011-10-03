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
	
	
	public function AJAX($d){
		switch($d->do){
			case 'init': return $this->InitData($d->types, $d->bdt, $d->edt);
			case 'events': return $this->EventList($d->types, $d->bdt, $d->edt);
			case 'eventsave': return $this->EventSave($d->owner, $d->tname, $d->event);
			case 'eventremove': return $this->EventRemove($d->owner, $d->tname, $d->eventid);
		}
		return null;
	}
	
	private function ToArray($rows){
		$ret = array();
		while (($row = $this->db->fetch_array($rows))){
			array_push($ret, $row);
		}
		return $ret;
	}
	
	public function InitData($types, $bDate, $eDate){
		$ret = new stdClass();
		$ret->types = $this->EventList($types, $bDate, $eDate);
		return $ret;
	}
	
	public function EventList($types, $bDate, $eDate){
		$ret = array();
		foreach ($types as $tp){
			$manager = CMSRegistry::$instance->modules->GetModule($tp->own)->GetManager();
			$tp->evs = $manager->CalendarAPI_EventList($tp->tnm, $bDate, $eDate);
			array_push($ret, $tp);
		}
		return $ret;
	}
	
	public function EventSave($owner, $tname, $event){
		$manager = CMSRegistry::$instance->modules->GetModule($owner)->GetManager();
		return $manager->CalendarAPI_EventSave($tname, $event);
	}
	
	public function EventRemove($owner, $tname, $eventid){
		$manager = CMSRegistry::$instance->modules->GetModule($owner)->GetManager();
		return $manager->CalendarAPI_EventRemove($tname, $eventid);
	}
	
	
	public function CalendarAPI_EventList($tname, $bDate, $eDate){
		if (!$this->IsWriteRole()){ return null; }
		
		$rows = CalendarQuery::EventList($this->db, $this->userid, $bDate, $eDate);
		return $this->ToArray($rows);
	}

	public function CalendarAPI_Event($tname, $eventid){
		if (!$this->IsWriteRole()){ return null; }
		
		return CalendarQuery::Event($this->db, $eventid, $this->userid);
	}
	
	public function CalendarAPI_EventSave($tname, $e){
		if (!$this->IsWriteRole()){ return null; }
		
		if (bkint($e->bdt) == 0 || bkint($e->edt) == 0){
			return null;
		}
		
		$utmanager = CMSRegistry::$instance->GetUserTextManager();
		$e->tl = $utmanager->Parser($e->tl);
		$e->bd = $utmanager->Parser($e->bd);
		$e->id = intval($e->id);
		
		if ($e->id == 0){
			$e->id = CalendarQuery::EventAppend($this->db, $e, $this->userid);
		}else{
			CalendarQuery::EventUpdate($this->db, $e, $this->userid);
		}
		return $this->CalendarAPI_Event($tname, $e->id);
	}
	
	public function CalendarAPI_EventRemove($tname, $eventid){
		if (!$this->IsWriteRole()){ return null; }
		CalendarQuery::EventRemove($this->db, $eventid, $this->userid);
		
		return $eventid;
	}
	

	public function DSProcess($name, $rows){
	}
	
	public function DSGetData($name, $rows){
		return null;
	}
}

?>