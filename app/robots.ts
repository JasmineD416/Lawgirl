import {settings} from './server/core';
export const dynamic='force-dynamic';
export default function robots(){const s=settings();return {rules:{userAgent:'*',...(s.PUBLIC_INDEXING==='true'?{allow:'/',disallow:['/admin','/api/','/library','/certificate/','/newsletter/confirm','/unsubscribe']}:{disallow:'/'})},...(s.PUBLIC_INDEXING==='true'&&s.SITE_URL?{sitemap:String(s.SITE_URL)+'/sitemap.xml'}:{})}}
