import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import AppRouter from './routes/AppRouter';
import ToastContainer from './components/common/Toast';
import SplashScreen from './components/common/SplashScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function App() {
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('adapt_splash_seen'));

  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem('adapt_splash_seen', '1');
    }, 3200);
    return () => clearTimeout(timer);
  }, [showSplash]);

  return (
    <QueryClientProvider client={queryClient}>
      <AnimatePresence>{showSplash && <SplashScreen key="splash" />}</AnimatePresence>
      <BrowserRouter>
        <AppRouter />
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
