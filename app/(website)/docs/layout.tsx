import {Inter} from 'next/font/google';
import DocsShell from '@/components/docs/docs-shell';
import {DOCS_SEARCH} from '@/lib/docs';
import tokens from '@/components/docs/tokens.module.css';
const inter=Inter({subsets:['latin'],display:'swap'});
export default function DocsLayout({children}:{children:React.ReactNode}){return <div className={`${tokens.root} ${inter.className}`} lang="en" dir="ltr"><DocsShell entries={DOCS_SEARCH}>{children}</DocsShell></div>}
