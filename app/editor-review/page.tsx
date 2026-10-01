import { notFound } from "next/navigation";
import EditorReview from "./review";
export const metadata={robots:{index:false,follow:false}};
export default function Page({searchParams}:{searchParams:{frame?:string;screen?:string}}){
  if(process.env.VERCEL_ENV !== "preview" && process.env.NODE_ENV === "production") notFound();
  return <EditorReview frame={searchParams.frame === "1"} screen={searchParams.screen === "pricing" ? "pricing" : "editor"}/>;
}
