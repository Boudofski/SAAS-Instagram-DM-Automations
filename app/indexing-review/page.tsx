"use client";
import { useState } from "react";
export default function Review() {
 const [path,setPath]=useState("/blog#all-guides-title");
 const [theme,setTheme]=useState("light");
 if(process.env.NEXT_PUBLIC_VERCEL_ENV==="production") return null;
 return <main style={{padding:16,background:"#ddd",color:"#111"}}>
 <h1>Temporary responsive review</h1>
 <label>Page <select value={path} onChange={e=>setPath(e.target.value)}>
 <option value="/blog#all-guides-title">Directory</option>
 <option value="/blog/get-started-with-ap3k">Guide</option>
 <option value="/docs/post-automation/post-automation-templates">Templates</option>
 <option value="/docs/getting-started/ap3k-plans-and-pricing">Plans</option>
 </select></label>
 <button onClick={()=>{const next=theme==="light"?"dark":"light";localStorage.setItem("theme",next);setTheme(next)}}>Theme: {theme}</button>
 <div style={{display:"flex",gap:24,marginTop:16}}>{[390,320].map(width=><div key={width}><h2>{width}px</h2><iframe title={String(width)} key={path+theme} src={path} style={{width,height:1000,border:"1px solid #aaa",background:"white"}} /></div>)}</div>
 </main>;
}