import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: {default:'Law Girl™ | Real Talk. Real Law. Real Life.',template:'%s | Law Girl'},description:'Founded by lawyer, author, entrepreneur and podcast host Jasmine Daya, Law Girl is a media and educational platform bringing together law, business, lifestyle and candid conversations.', icons:{icon:'/favicon.svg'} };
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
