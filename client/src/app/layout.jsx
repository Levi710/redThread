import './globals.css';
import Header from '../components/Header';
import { Providers } from '../components/Providers';

export const metadata = {
    title: 'RedThread - AI-assisted location-based recommendations',
    description: 'Find the perfect spot, powered by AI.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body suppressHydrationWarning={true}>
                <Providers>
                    <Header />
                    {children}
                </Providers>
            </body>
        </html>
    );
}
