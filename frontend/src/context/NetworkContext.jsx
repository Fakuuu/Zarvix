import { createContext, useContext, useState, useEffect, useRef } from 'react';

const NetworkContext = createContext({ online: true, syncing: false, setSyncing: () => {} });

export function NetworkProvider({ children }) {
  const [online,   setOnline]   = useState(navigator.onLine);
  const [syncing,  setSyncing]  = useState(false);
  const syncTimer = useRef(null);

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
      setSyncing(true);
      // Límite de 5 s para el estado "sincronizando", por si el caller no lo limpia
      clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => setSyncing(false), 5000);
    }
    function handleOffline() {
      setOnline(false);
      setSyncing(false);
      clearTimeout(syncTimer.current);
    }

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(syncTimer.current);
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ online, syncing, setSyncing }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
