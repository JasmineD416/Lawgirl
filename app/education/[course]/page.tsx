import {notFound} from 'next/navigation';
import {getCatalog} from '../../server/catalog';
import {readerCourse} from '../../catalog';
import {hasCourseAccess} from '../../server/courses';
import {currentUser,viewer} from '../../server/session';
import Course from './course';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{course:string}>}){const {course}=await params;const item=(await getCatalog()).courses.find((x:any)=>x.slug===course);return {title:item?.title||'Education'}}
export default async function Page({params}:{params:Promise<{course:string}>}){const {course}=await params;const item=(await getCatalog()).courses.find((x:any)=>x.slug===course);if(!item)notFound();const user=await currentUser();const entitled=await hasCourseAccess(item,user);return <Course course={readerCourse(item,entitled)} access={{paid:item.access==='paid',entitled,priceLabel:item.priceLabel||'',open:item.enrollment==='open'&&!!item.price}} user={viewer(user)}/>}
