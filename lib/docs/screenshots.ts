// Captured from the connected @ap3kautomation account on October 2, 2026.
// These are actual product views, never generated interface illustrations.
type Shot={file:string;caption:string;after?:string};
const trigger:Shot={file:'trigger',caption:'Add the GUIDE keyword and choose the matching and repeat-delivery rules.'};
const message:Shot={file:'message',caption:'Write your DM, add the destination URL, and preview the Get the Link button.'};
const replies:Shot={file:'replies',caption:'Configure AI public replies and the public reply limit in AP3K.'};
const account:Shot={file:'account',caption:'The connected @ap3kautomation account in AP3K.'};
export const DOCS_SCREENSHOTS:Record<string,Shot[]>={
 'getting-started/what-is-ap3k':[{file:'dashboard',caption:'The AP3K dashboard with the connected @ap3kautomation profile.'}],
 'getting-started/connect-instagram-account':[account],
 'how-tos/add-another-instagram-account':[account],
 'migrating-from-manychat/connect-your-account':[account],
 'troubleshoot/reconnect-instagram-after-password-change':[account],
 'post-automation/create-instagram-comment-to-dm-automation':[{file:'create',caption:'Choose Post automation to respond to comments on a post or Reel.',after:'step-3-create-a-post-automation'},{...trigger,after:'step-4-configure-your-automation'},{...message,after:'step-4-configure-your-automation'}],
 'post-automation/choose-which-post-or-reel-to-automate':[{file:'post',caption:'Choose an existing post or Reel from the connected Instagram account.'}],
 'post-automation/instagram-automation-triggers':[trigger],
 'post-automation/ai-public-comment-replies':[replies],
 'how-tos/limit-public-replies-on-instagram-automation':[replies],
 'post-automation/dm-message-layouts-text-buttons-attachments':[message],
 'post-automation/dm-message-variations':[message],
 'post-automation/collect-email-and-phone-number-in-dm':[{file:'collect',caption:'Configure email or phone collection before delivering your link.'}],
 'post-automation/ask-to-follow-before-sending-dm':[{file:'follow',caption:'Configure the follow request in the AP3K editor.'}],
 'post-automation/add-delay-between-automation-steps':[{file:'delay',caption:'Enable delay to reveal the Add delay controls.'}],
 'flow-builder/wiring-basics':[{file:'flow',caption:'Build and connect steps on the AP3K Flow canvas.'}],
 'flow-builder/trigger-node':[{file:'flow',caption:'Start the flow with an Instagram trigger.'}],
};
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function articleWithScreenshots(slug:string,html:string){
 const shots=DOCS_SCREENSHOTS[slug]||[];
 // Place screenshots beside the relevant instructions without inserting into a list/table.
 for(let i=0;i<shots.length;i++){const shot=shots[i];const figure=`<figure tabindex="0" role="button" aria-label="Enlarge: ${escape(shot.caption)}"><img src="/images/docs/${shot.file}.webp" alt="${escape(shot.caption)}" width="1363" height="935" loading="lazy" decoding="async"/><figcaption>${escape(shot.caption)} Click to enlarge.</figcaption></figure>`;
 const headings=Array.from(html.matchAll(/<h2\b[^>]*>/g)); const section=shot.after?html.indexOf(`id="${shot.after}"`):-1; const target=section>=0?headings.find(h=>(h.index??0)>section):headings[1];
 if(target?.index!==undefined)html=html.slice(0,target.index)+figure+html.slice(target.index);else html+=figure;
 }
 return html;
}
