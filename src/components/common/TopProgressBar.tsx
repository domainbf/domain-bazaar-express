import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const TopProgressBar = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setVisible(true);
    setKey(k => k + 1);
    const t = setTimeout(() => setVisible(false), 1600);
    return () => clearTimeout(t);
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 overflow-hidden pointer-events-none">
      <div
        key={key}
        className="h-full bg-primary animate-progress origin-left"
      />
    </div>
  );
};
