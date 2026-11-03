import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: {default:'Law Girl | Education & Media by Jasmine Daya',template:'%s | Law Girl'},description:'Breaking down the law because I’ve got your back. Books, podcasts, legal commentary and education by Jasmine Daya.', icons:{icon:'/favicon.svg'} };
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
