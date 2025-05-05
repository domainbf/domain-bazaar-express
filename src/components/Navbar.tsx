
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, Menu, User, LogIn, ShoppingCart, Home, Settings } from 'lucide-react';
import { AuthModal } from './AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationsMenu } from './notifications/NotificationsMenu';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';

interface NavbarProps {
  transparent?: boolean;
}

export const Navbar = ({ transparent = false }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    if (location.pathname !== '/') {
      window.location.href = '/';
    }
  };

  const navbarClass = transparent
    ? `fixed w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
      }`
    : 'bg-white shadow-sm';

  const textColor = transparent && !scrolled ? 'text-white' : 'text-gray-900';

  return (
    <nav className={navbarClass}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-xl md:text-2xl font-bold flex items-center">
          <span className={`${textColor}`}>NIC.BN</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className={`font-medium ${textColor} hover:text-gray-600`}>
            {t('home')}
          </Link>
          <Link to="/marketplace" className={`font-medium ${textColor} hover:text-gray-600`}>
            {t('marketplace')}
          </Link>
          {user && (
            <>
              <Link to="/dashboard" className={`font-medium ${textColor} hover:text-gray-600`}>
                {t('dashboard')}
              </Link>
              <Link to="/user-center" className={`font-medium ${textColor} hover:text-gray-600`}>
                {t('user_center')}
              </Link>
              {profile?.is_admin && (
                <Link to="/admin" className={`font-medium ${textColor} hover:text-gray-600`}>
                  {t('admin')}
                </Link>
              )}
            </>
          )}
          
          <LanguageSwitcher className={textColor} />
          
          {user ? (
            <div className="flex items-center gap-2">
              <NotificationsMenu />
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  className="p-2 group relative flex hover:bg-gray-100 rounded-full"
                  asChild
                >
                  <Link to="/profile">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile?.full_name || 'User profile'}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className={`${textColor} h-5 w-5`} />
                    )}
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className={textColor} onClick={handleLogout}>
                  {t('logout')}
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setIsAuthModalOpen(true)} variant="default">
              {t('login')}
            </Button>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher className={textColor} />
          
          {user && <NotificationsMenu />}
          
          <Button
            variant="ghost"
            className="p-2"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className={`h-6 w-6 ${textColor}`} />
            ) : (
              <Menu className={`h-6 w-6 ${textColor}`} />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <div className="container mx-auto px-4 py-2 space-y-2">
            <Link
              to="/"
              className="block py-2 px-4 hover:bg-gray-100 rounded font-medium flex items-center gap-2"
            >
              <Home className="h-5 w-5" /> {t('home')}
            </Link>
            <Link
              to="/marketplace"
              className="block py-2 px-4 hover:bg-gray-100 rounded font-medium flex items-center gap-2"
            >
              <ShoppingCart className="h-5 w-5" /> {t('marketplace')}
            </Link>

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="block py-2 px-4 hover:bg-gray-100 rounded font-medium flex items-center gap-2"
                >
                  <Settings className="h-5 w-5" /> {t('dashboard')}
                </Link>
                <Link
                  to="/user-center"
                  className="block py-2 px-4 hover:bg-gray-100 rounded font-medium flex items-center gap-2"
                >
                  <User className="h-5 w-5" /> {t('user_center')}
                </Link>
                {profile?.is_admin && (
                  <Link
                    to="/admin"
                    className="block py-2 px-4 hover:bg-gray-100 rounded font-medium flex items-center gap-2"
                  >
                    <Settings className="h-5 w-5" /> {t('admin')}
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="block py-2 px-4 hover:bg-gray-100 rounded font-medium flex items-center gap-2"
                >
                  <User className="h-5 w-5" /> {t('profile')}
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start py-2 px-4 hover:bg-gray-100 rounded font-medium flex items-center gap-2"
                  onClick={handleLogout}
                >
                  <LogIn className="h-5 w-5" /> {t('logout')}
                </Button>
              </>
            ) : (
              <Button
                className="w-full"
                onClick={() => {
                  setIsOpen(false);
                  setIsAuthModalOpen(true);
                }}
              >
                {t('login')}
              </Button>
            )}
          </div>
        </div>
      )}

      <AuthModal open={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </nav>
  );
};
