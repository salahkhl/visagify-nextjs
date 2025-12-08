import PublicHeader from './PublicHeader';
import Footer from './Footer';

interface PublicLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export default function PublicLayout({ 
  children, 
  showFooter = true 
}: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}


