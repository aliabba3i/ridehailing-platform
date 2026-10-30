import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title:'RideHailing Control Center',description:'Operations management console' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html> }
