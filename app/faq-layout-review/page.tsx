"use client";
import {useEffect} from "react";
import {useTheme} from "next-themes";
import HomeFaq from "@/components/website/home-faq";
import WebsiteFooter from "@/components/global/website-footer";
import QuickStart from "@/components/dashboard/quick-start";
export default function Review({searchParams}:{searchParams:{theme?:string;section?:string}}){
 const {setTheme}=useTheme();
 useEffect(()=>setTheme(searchParams.theme==='light'?'light':'dark'),[searchParams.theme,setTheme]);
 return <main>{searchParams.section==='faq'?<HomeFaq/>:<><div className="mx-auto max-w-[1320px] px-4 py-10"><QuickStart slug="review"/></div><WebsiteFooter/></>}</main>;
}
