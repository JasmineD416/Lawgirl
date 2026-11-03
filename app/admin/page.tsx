import {requireUser} from '../server/session';
import {isOwnerUser} from '../server/auth';
import Dashboard from './dashboard';
export const dynamic='force-dynamic';
export const metadata={title:'Owner Studio'};
export default async function Page(){const user=await requireUser('/admin');if(!isOwnerUser(user))return <main className="inner"><header className="page-intro"><p className="eyebrow">Law Girl Owner Studio</p><h1>Owner access required.</h1><p>This area is available only to the site owner’s account, after its email address is confirmed.</p><a href="/" className="text-link">Return to Law Girl</a></header></main>;return <Dashboard/>}
