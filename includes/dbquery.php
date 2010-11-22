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

		
	private static function DayToDate($day){
		return $day * 60 * 60 * 24;
	}
	
	public static function DaysSQL(CMSDatabase $db, $userid, $data){
		$where = array();
		foreach ($data as $days){
			$bdt = CalendarQuery::DayToDate($days->b);
			$edt = CalendarQuery::DayToDate($days->e+1);
			array_push($where, "(datebegin >= ".bkint($bdt)." AND dateend <= ".bkint($edt).")");
		}
		if (empty($where)){ return null; }
		
		$sql = "
			SELECT 
				taskid as id,
				userid as uid,
				title as tl,
				datebegin as bdt,
				ROUND((dateend - datebegin)/60) as edt,
				tasktype as tp
			FROM ".$db->prefix."cdr_task
			WHERE userid=".bkint($userid)." AND (".implode(" OR ", $where).") 
		";
		return $sql;
	}
	
	public static function Days(CMSDatabase $db, $userid, $data){
		$sql = CalendarQuery::DaysSQL($db, $userid, $data);
		return $db->query_read($sql);
	}
	
	public static function TaskRemove(CMSDatabase $db, $taskid){
		$sql = "
			DELETE FROM ".$db->prefix."cdr_task 
			WHERE taskid=".bkint($taskid)."
		";
		$db->query_write($sql);
	}
	
	public static function TaskUpdate(CMSDatabase $db, $d){
		$sql = "
			UPDATE ".$db->prefix."cdr_task 
			SET
				title='".bkstr($d->tl)."',
				descript='".bkstr($d->dsc)."',
				datebegin=".bkint($d->bdt).",
				dateend=".bkint($d->edt).",
				tasktype=".bkint($d->tp).",
				options='".bkstr($d->ops)."',
				permlevel=".bkint($d->plvl)."
			WHERE taskid=".bkint($d->id)."
		";
		$db->query_write($sql);
	}
	
	
	public static function TaskAppend(CMSDatabase $db, $data){
		if (bkint($data->bdt) == 0 || bkint($data->edt) == 0){
			return;
		}
		$sql = "
			INSERT INTO ".$db->prefix."cdr_task
				(userid, title, descript, datebegin, dateend, dateline, owner, permlevel, tasktype, options) VALUES 
			(
				".bkint($data->uid).",
				'".bkstr($data->tl)."',
				'".bkstr($data->dsc)."',
				".bkint($data->bdt).",
				".bkint($data->edt).",
				".TIMENOW.",
				'".bkstr($data->own)."',
				".bkint($data->plvl).",
				".bkint($data->tp).",
				'".bkstr($data->ops)."'
			)
		";
		$db->query_write($sql);
	}
	
	public static function Task(CMSDatabase $db, $taskid){
		$sql = "
			SELECT 
				taskid as id,
				userid as uid,
				title as tl,
				datebegin as bdt,
				dateend as edt,
				dateline as dl,
				descript as dsc,
				permlevel as plvl,
				tasktype as tp,
				options as ops
			FROM ".$db->prefix."cdr_task
			WHERE taskid='".bkint($taskid)."'
			LIMIT 1 
		";
		return $db->query_first($sql);
	}
	
	public static function TaskList(CMSDatabase $db, $datebegin, $dateend, $userid){
		$sql = "
			SELECT 
				taskid as id,
				userid as uid,
				title as tl,
				datebegin as bdt,
				dateend as edt
			FROM ".$db->prefix."cdr_task
			WHERE userid=".bkint($userid)." 
				AND datebegin >= ".bkint($datebegin)."
				AND dateend <= ".bkint($dateend)."
		";
		return $db->query_read($sql);
	}

	
	
}

?>