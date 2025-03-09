
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from '@supabase/supabase-js';
import { Menu, X } from 'lucide-react';

export const Navbar = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out');
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="w-full bg-gray-900 shadow-md py-4 text-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Desktop Navigation */}
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-white">DomainX</Link>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 focus:outline-none" 
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Menu className="h-6 w-6 text-white" />
            )}
          </button>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-white hover:text-gray-300 transition-colors font-medium">Home</Link>
            <Link to="/marketplace" className="text-white hover:text-gray-300 transition-colors font-medium">Marketplace</Link>
            
            {user ? (
              <>
                <Link to="/dashboard" className="text-white hover:text-gray-300 transition-colors font-medium">Dashboard</Link>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="border-gray-400 text-white hover:bg-gray-700 font-medium"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => openAuthModal('signin')}
                  className="border-gray-400 text-white hover:bg-gray-700 font-medium"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => openAuthModal('signup')}
                  className="bg-white text-gray-900 hover:bg-gray-200 font-medium"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Mobile Menu - Improved contrast and readability */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 py-2 space-y-3 flex flex-col bg-gray-800 rounded-lg animate-fade-in border border-gray-700">
            <Link 
              to="/" 
              className="text-white hover:text-gray-300 py-3 px-4 block font-medium hover:bg-gray-700 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/marketplace" 
              className="text-white hover:text-gray-300 py-3 px-4 block font-medium hover:bg-gray-700 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Marketplace
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="text-white hover:text-gray-300 py-3 px-4 block font-medium hover:bg-gray-700 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <div className="px-4 py-2">
                  <Button 
                    variant="outline" 
                    onClick={handleSignOut}
                    className="border-gray-600 text-white hover:bg-gray-700 w-full font-medium"
                  >
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col space-y-2 px-4 py-2">
                <Button 
                  variant="outline" 
                  onClick={() => openAuthModal('signin')}
                  className="border-gray-600 text-white hover:bg-gray-700 w-full font-medium"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => openAuthModal('signup')}
                  className="bg-white text-gray-900 hover:bg-gray-200 w-full font-medium"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        )}
        
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          mode={authMode} 
        />
      </div>
    </nav>
  );
};
