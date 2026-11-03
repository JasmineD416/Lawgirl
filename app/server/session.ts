import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {userFromCookieHeader,type AccountUser} from './auth';

// Signed-in Law Girl account for server components.
export async function currentUser():Promise<AccountUser|null>{return userFromCookieHeader((await headers()).get('cookie'))}
export async function requireUser(returnTo:string):Promise<AccountUser>{const user=await currentUser();if(user)return user;redirect('/signin?return_to='+encodeURIComponent(returnTo))}
export const viewer=(user:AccountUser|null)=>user?{name:user.firstName+' '+user.lastName,email:user.email,verified:user.verified}:null;
