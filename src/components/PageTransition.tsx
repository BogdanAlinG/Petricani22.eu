import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigation } from '../contexts/NavigationContext';

interface Props {
  children: React.ReactNode;
}

export default function PageTransition({ children }: Props) {
  const location = useLocation();
  const { direction, setDirection } = useNavigation();
  const [phase, setPhase] = useState<'idle' | 'exit' | 'enter'>('idle');
  const [displayChildren, setDisplayChildren] = useState(children);
  const prevPathRef = useRef(location.pathname);
  const pendingChildrenRef = useRef(children);
  const animatingRef = useRef(false);

  useEffect(() => {
    pendingChildrenRef.current = children;

    if (location.pathname === prevPathRef.current) {
      setDisplayChildren(children);
      return;
    }

    if (animatingRef.current) {
      prevPathRef.current = location.pathname;
      setDisplayChildren(children);
      setDirection('forward');
      return;
    }

    animatingRef.current = true;
    setPhase('exit');

    const exitTimer = setTimeout(() => {
      if (!location.hash) {
        window.scrollTo(0, 0);
      }
      setDisplayChildren(pendingChildrenRef.current);
      prevPathRef.current = location.pathname;
      setPhase('enter');

      const enterTimer = setTimeout(() => {
        setPhase('idle');
        setDirection('forward');
        animatingRef.current = false;
      }, 350);

      return () => clearTimeout(enterTimer);
    }, 220);

    return () => clearTimeout(exitTimer);
  }, [location.pathname]);

  const getStyle = (): React.CSSProperties => {
    if (phase === 'idle') return {};

    if (phase === 'exit') {
      return direction === 'back'
        ? { animation: 'slideOutToRight 220ms cubic-bezier(0.4,0,0.6,1) both' }
        : { animation: 'slideOutToLeft 220ms cubic-bezier(0.4,0,0.6,1) both' };
    }

    if (phase === 'enter') {
      return direction === 'back'
        ? { animation: 'slideInFromLeft 350ms cubic-bezier(0.22,1,0.36,1) both' }
        : { animation: 'slideInFromRight 350ms cubic-bezier(0.22,1,0.36,1) both' };
    }

    return {};
  };

  return (
    <div style={{ overflow: 'hidden' }}>
      <div style={getStyle()}>
        {displayChildren}
      </div>
    </div>
  );
}
