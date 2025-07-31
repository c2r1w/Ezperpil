
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ConditionalNav } from '@/components/conditional-nav';
import Script from 'next/script';
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'EZ Perfil Webinars',
  description: 'Elevate Your Outreach with Webinars',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="font-body antialiased bg-background text-foreground">
        <ConditionalNav />
        {children}
        <Toaster />
        
        {/* Attractive Language Switcher */}
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center gap-2 px-4 py-3 text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-sm">Translate</span>
              <div id="google_translate_element" className="opacity-0 absolute"></div>
            </div>
          </div>
          <div className="text-xs text-gray-400 text-center mt-2 animate-pulse">
            🌐 Click to change language
          </div>
        </div>
        
        {/* Google Translate Script with Custom Styling */}
        <Script
          id="google-translate-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              function googleTranslateElementInit() {
                new google.translate.TranslateElement(
                  {
                    pageLanguage: 'es',
                    includedLanguages: 'en,es',
                    layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false
                  },
                  'google_translate_element'
                );
                
                // Custom styling and click handler
                setTimeout(() => {
                  const translateButton = document.querySelector('.bg-gradient-to-r');
                  const googleWidget = document.querySelector('#google_translate_element select');
                  
                  if (translateButton && googleWidget) {
                    translateButton.addEventListener('click', () => {
                      googleWidget.click();
                    });
                  }
                  
                  // Hide Google's default styling
                  const style = document.createElement('style');
                  style.textContent = \`
                    .goog-te-gadget {
                      font-family: inherit !important;
                      font-size: inherit !important;
                    }
                    .goog-te-gadget .goog-te-combo {
                      margin: 0 !important;
                      background: transparent !important;
                      border: none !important;
                      color: white !important;
                      cursor: pointer !important;
                    }
                    .goog-logo-link {
                      display: none !important;
                    }
                    .goog-te-gadget .goog-te-combo option {
                      background: #1f2937 !important;
                      color: white !important;
                    }
                    #google_translate_element {
                      position: absolute !important;
                      top: 0 !important;
                      left: 0 !important;
                      width: 100% !important;
                      height: 100% !important;
                      opacity: 0 !important;
                      cursor: pointer !important;
                    }
                    #google_translate_element select {
                      width: 100% !important;
                      height: 100% !important;
                      opacity: 0 !important;
                      cursor: pointer !important;
                    }
                  \`;
                  document.head.appendChild(style);
                }, 1000);
              }
            `,
          }}
        />
        <Script
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
