import {database} from './core';
import {isOwnerUser,type AccountUser} from './auth';
import {getCatalog} from './catalog';

// Law Girl’s Law School: paid courses are sold through Stripe Checkout and unlocked per signed-in user.
export const courseProduct=(id:string)=>'course:'+id;
export async function hasCourseAccess(course:any,user:AccountUser|null){if(course.access!=='paid')return true;if(!user)return false;if(isOwnerUser(user))return true;const row=await database().prepare('SELECT 1 AS ok FROM orders WHERE user_id=? AND product=? AND revoked_at IS NULL').bind(user.id,courseProduct(course.id)).first();return !!row}
export async function getCourseConfig(product:string){if(!product.startsWith('course:'))return null;const c=(await getCatalog()).courses.find((x:any)=>courseProduct(x.id)===product);return c&&c.access==='paid'?{id:product,price:c.price,file:'',title:c.title,slug:c.slug}:null}
