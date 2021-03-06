<?php 
/**
 * Модуль Calendar
 * 
 * @version $Id$
 * @package Abricos 
 * @subpackage MyMedia
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

class CalendarModule extends Ab_Module {
	
	private $_manager = null;
	
	public function __construct(){
		// Версия модуля
		$this->version = "0.1.5";
		
		// Название модуля
		$this->name = "calendar";
		
		$this->permission = new CalendarPermission($this);
	}
	
	public function GetManager(){
		if (is_null($this->_manager)){
			require_once 'includes/manager.php';
			$this->_manager = new CalendarManager($this);
		}
		return $this->_manager;
	}
}

class CalendarAction {
	const WRITE = 30;
	const ADMIN = 50;
}

class CalendarPermission extends CMSPermission {

	public function CalendarPermission(CalendarModule $module){
		
		$defRoles = array(
			new CMSRole(CalendarAction::WRITE, 1, User::UG_REGISTERED),
			
			new CMSRole(CalendarAction::WRITE, 1,User::UG_ADMIN),
			new CMSRole(CalendarAction::ADMIN, 1, User::UG_ADMIN)
		);
		
		parent::CMSPermission($module, $defRoles);
	}
	
	public function GetRoles(){
		$roles = array();
		$roles[CalendarAction::WRITE] = $this->CheckAction(CalendarAction::WRITE);
		$roles[CalendarAction::ADMIN] = $this->CheckAction(CalendarAction::ADMIN);
		return $roles;
	}
}

Abricos::ModuleRegister(new CalendarModule());

?>