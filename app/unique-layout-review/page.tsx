"use client";
import { useEffect } from "react";
import { useTheme } from "next-themes";
import HomeUniqueResponses from "@/components/website/home-unique-responses";
import QuickStart from "@/components/dashboard/quick-start";
export default function Review() {
 const {setTheme}=useTheme();
 useEffect(()=>{setTheme(new URLSearchParams(location.search).get("theme") || "light");},[setTheme]);
 return <main><HomeUniqueResponses/><div className="mx-auto max-w-6xl p-4"><QuickStart slug="review"/></div></main>;
}
