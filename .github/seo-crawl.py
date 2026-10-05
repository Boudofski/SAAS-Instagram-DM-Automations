import concurrent.futures, hashlib, json, os, re, time
from collections import Counter
from urllib.parse import urljoin, urlsplit, urldefrag
from urllib.robotparser import RobotFileParser
from xml.etree import ElementTree as ET
import requests
from bs4 import BeautifulSoup
BASE='https://ap3k.com';OUT='/tmp/ap3k-seo-evidence';UA='AP3K-SEO-Audit/1.0 (+https://ap3k.com)'
os.makedirs(OUT+'/pages',exist_ok=True)
def get(url):
    session=requests.Session();session.max_redirects=3
    return session.get(url,headers={'User-Agent':UA},timeout=30)
robots=get(BASE+'/robots.txt')
if robots.status_code!=200:raise RuntimeError('Cannot verify robots policy')
open(OUT+'/robots.txt','w').write(robots.text)
rp=RobotFileParser();rp.parse(robots.text.splitlines())
sitemap=get(BASE+'/sitemap.xml');open(OUT+'/sitemap.xml','w').write(sitemap.text)
roots=[ET.fromstring(sitemap.content)]
if roots[0].tag.endswith('sitemapindex'):
    roots=[ET.fromstring(get(n.text).content) for n in roots[0].findall('{*}sitemap/{*}loc') if urlsplit(n.text).netloc=='ap3k.com']
sm=[n.text for root in roots for n in root.findall('{*}url/{*}loc')]
priority=['/','/pricing','/instagram-comment-to-dm','/instagram-dm-automation','/instagram-comment-automation','/manychat-alternative','/docs','/help','/blog','/about','/contact','/tutorials/instagram-comment-to-dm','/blog/manychat-vs-ap3k-pricing-for-instagram','/fr','/de','/es','/pt','/ar','/llms.txt','/video-sitemap.xml']
def order(u):
    path=urlsplit(u).path
    return (bool(re.match(r'^/(fr|de|es|pt|ar)(/|$)',path)),len(path.split('/')),u)
queue=list(dict.fromkeys([BASE+p for p in priority]+sorted(sm,key=order)))
seen,results=set(),[]
def crawl(u):
    if not rp.can_fetch(UA,u):return {'url':u,'blocked_by_robots':True}
    started=time.time()
    try:
        r=get(u)
        if r.status_code==429:time.sleep(15);r=get(u)
        key=hashlib.sha256(u.encode()).hexdigest()[:16]
        open(OUT+'/pages/'+key+'.html','w').write(r.text)
        s=BeautifulSoup(r.text,'html.parser')
        def meta(n):return next((x.get('content','') for x in s.find_all('meta') if x.get('name')==n or x.get('property')==n),'')
        can=s.find('link',rel='canonical');clean=BeautifulSoup(str(s.find('main') or s.body or s),'html.parser')
        for t in clean(['script','style','nav','header','footer']):t.decompose()
        text,links,ld=clean.get_text(' ',strip=True),[],[]
        for a in s.find_all('a',href=True):
            v=urldefrag(urljoin(r.url,a['href']))[0]
            if urlsplit(v).netloc=='ap3k.com' and urlsplit(v).scheme=='https':links.append({'url':v,'anchor':a.get_text(' ',strip=True)})
        for x in s.find_all('script',type='application/ld+json'):
            try:ld.append(json.loads(x.string or x.get_text()))
            except Exception as e:ld.append({'parse_error':str(e)})
        return {'url':u,'final_url':r.url,'status':r.status_code,'redirects':[{'url':x.url,'status':x.status_code} for x in r.history],'elapsed_ms':round((time.time()-started)*1000),'bytes':len(r.content),'html_file':'pages/'+key+'.html','title':s.title.get_text(' ',strip=True) if s.title else '','description':meta('description'),'robots':meta('robots'),'x_robots_tag':r.headers.get('x-robots-tag'),'canonical':can.get('href') if can else None,'lang':s.html.get('lang') if s.html else None,'h1':[x.get_text(' ',strip=True) for x in s.find_all('h1')],'headings':[{'tag':x.name,'text':x.get_text(' ',strip=True)} for x in s.find_all(re.compile('^h[1-6]$'))],'hreflang':[{'lang':x.get('hreflang'),'url':x.get('href')} for x in s.find_all('link',hreflang=True)],'words':len(text.split()),'text':text,'text_hash':hashlib.sha256(text.encode()).hexdigest(),'links':links,'json_ld':ld,'images':[{'src':x.get('src'),'alt':x.get('alt'),'width':x.get('width'),'height':x.get('height'),'loading':x.get('loading'),'fetchpriority':x.get('fetchpriority')} for x in s.find_all('img')],'headers':{k:v for k,v in r.headers.items() if k.lower() in ['content-type','cache-control','strict-transport-security','x-frame-options','x-content-type-options','content-security-policy','x-vercel-cache']}}
    except Exception as e:return {'url':u,'error':str(e)}
while queue and len(results)<500:
    batch=[]
    while queue and len(batch)<5 and len(results)+len(batch)<500:
        u=queue.pop(0)
        if u in seen:continue
        seen.add(u)
        if urlsplit(u).netloc=='ap3k.com':batch.append(u)
    if not batch:continue
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:rows=list(pool.map(crawl,batch))
    results.extend(rows)
    for row in rows:
        for a in row.get('links',[]):
            p=urlsplit(a['url'])
            if a['url'] not in seen and not p.query and not re.search(r'\.(png|jpg|jpeg|webp|svg|pdf|mp4)$',p.path):queue.append(a['url'])
    open(OUT+'/crawl.json','w').write(json.dumps({'captured_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'base':BASE,'sitemap_count':len(sm),'sitemap_urls':sm,'max_pages':500,'pages':results,'remaining_queue':len(set(queue)-seen)},ensure_ascii=False))
    print(len(results),dict(Counter(str(x.get('status',x.get('error','robots'))) for x in results)),flush=True)
    time.sleep(10 if any(x.get('status')==429 for x in rows) else 1)
