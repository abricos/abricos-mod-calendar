<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage Calendar
 * @copyright Copyright (C) 2010 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

class CalendarQuery {

	public static function EventList(Ab_Database $db, $userid, $datebegin, $dateend){
		$sql = "
			SELECT 
				eventid as id,
				userid as uid,
				title as tl,
				datebegin as bdt,
				dateend as edt
			FROM ".$db->prefix."cdr_event
			WHERE userid=".bkint($userid)." 
				AND datebegin >= ".bkint($datebegin)."
				AND dateend <= ".bkint($dateend)."
		";
		return $db->query_read($sql);
	}
	
	public static function Event(Ab_Database $db, $eventid, $userid){
		$sql = "
			SELECT 
				eventid as id,
				userid as uid,
				datebegin as bdt,
				dateend as edt,
				title as tl,
				descript as bd,
				dateline as dl,
				upddate as udl
			FROM ".$db->prefix."cdr_event
			WHERE eventid='".bkint($eventid)."' AND userid=".bkint($userid)." 
			LIMIT 1 
		";
		return $db->query_first($sql);
	}
	
	public static function EventAppend(Ab_Database $db, $e, $userid){
		$sql = "
			INSERT INTO ".$db->prefix."cdr_event
			(userid, title, descript, datebegin, dateend, dateline, upddate) VALUES (
				".bkint($userid).",
				'".bkstr($e->tl)."',
				'".bkstr($e->bd)."',
				".bkint($e->bdt).",
				".bkint($e->edt).",
				".TIMENOW.",
				".TIMENOW."
			)
		";
		$db->query_write($sql);
		return $db->insert_id();
	}
	
	public static function EventUpdate(Ab_Database $db,  $e, $userid){
		$sql = "
			UPDATE ".$db->prefix."cdr_event 
			SET
				title='".bkstr($e->tl)."',
				descript='".bkstr($e->bd)."',
				datebegin=".bkint($e->bdt).",
				dateend=".bkint($e->edt).",
				upddate=".TIMENOW."
			WHERE eventid='".bkint($e->id)."' AND userid=".bkint($userid)." 
			LIMIT 1 
		";
		
		$db->query_write($sql);
	}
	
	public static function EventRemove(Ab_Database $db,  $eventid, $userid){
		$sql = "
			DELETE FROM ".$db->prefix."cdr_event 
			WHERE eventid='".bkint($eventid)."' AND userid=".bkint($userid)." 
			LIMIT 1 
		";
		$db->query_write($sql);
	}
}

?>