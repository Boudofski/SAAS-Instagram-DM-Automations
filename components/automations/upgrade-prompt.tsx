"use client";
import {useEffect,useState} from "react";
import UpgradeDialog from "./upgrade-dialog";
import {UPGRADE_EVENT} from "@/lib/upgrade-prompt";
export default function UpgradePrompt(){const[open,setOpen]=useState(false);useEffect(()=>{const show=()=>setOpen(true);window.addEventListener(UPGRADE_EVENT,show);return()=>window.removeEventListener(UPGRADE_EVENT,show)},[]);return <UpgradeDialog open={open} onOpenChange={setOpen}/>;}
