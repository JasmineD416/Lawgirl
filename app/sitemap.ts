import {settings} from './server/core';
import {getCatalog} from './server/catalog';
export const dynamic='force-dynamic';
export default async function sitemap(){const origin=String(settings().SITE_URL||'').replace(/\/$/,'');const c=await getCatalog();const paths=['','about','podcast','books','articles','media','lowdown','newsletter','blog','education','law-school','signin','signup','stack','jdco','geraci','cbpla','privacy','terms',...c.products.map(p=>'stack/'+p[0].toLowerCase()),...c.courses.map(c=>'education/'+c.slug)];for(const [key,path] of [['blogs','blog'],['articles','articles'],['media','media'],['lowdown','lowdown']] as const)for(const item of c[key])if(item.body?.length&&item.slug)paths.push(path+'/'+item.slug);return paths.map(path=>({url:origin+'/'+path}))}
