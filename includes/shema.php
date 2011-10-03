<?php
/**
 * Схема таблиц модуля
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage Calendar
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$updateManager = CMSRegistry::$instance->modules->updateManager; 
$db = CMSRegistry::$instance->db;
$pfx = $db->prefix;

if ($updateManager->isInstall()){
}

if ($updateManager->isUpdate('0.1.2')){
	CMSRegistry::$instance->modules->GetModule('calendar')->permission->Reinstall();
}

if ($updateManager->isUpdate('0.1.3')){
	// Таблица мероприятий
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."cdr_event (
		  `eventid` int(10) unsigned NOT NULL auto_increment,
		  `userid` int(10) unsigned NOT NULL,
		  `title` varchar(250) NOT NULL default 'Заголовок задачи',
		  `descript` TEXT NOT NULL COMMENT 'Описание задачи',
		  `datebegin` int(10) unsigned NOT NULL default '0' COMMENT 'Время начала события',
		  `dateend` int(10) unsigned NOT NULL default '0' COMMENT 'Время окончания события',
		  `dateline` int(10) unsigned NOT NULL default '0' COMMENT 'Время создания события',
		  `upddate` int(10) unsigned NOT NULL default '0' COMMENT 'Время обновления события',
		  PRIMARY KEY  (`eventid`),
		  KEY `userid` (`userid`)
		)".$charset
	);
}

if ($updateManager->isUpdate('0.1.3') && !$updateManager->isInstall()){
	$db->query_write("
		INSERT INTO ".$pfx."cdr_event (userid, title, descript, datebegin, dateend, dateline)
		SELECT
			userid, title, descript, datebegin, dateend, dateline
		FROM ".$pfx."cdr_task
	");
	
	$db->query_write("DROP TABLE ".$pfx."cdr_task");
}

?>