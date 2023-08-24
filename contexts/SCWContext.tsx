import { createContext, useState, useEffect, ReactNode } from 'react';

type ContextType = {
  smartAccount: any;
  setSmartAccount: (value: any) => void;
};

export const SmartAccountContext = createContext<ContextType>({ smartAccount: null, setSmartAccount: smartAccount => console.warn("no smartAccount provider")});

type Props = {
  children: ReactNode;
};

export const SmartAccountProvider = ({ children }: Props) => {
  const [smartAccount, setSmartAccount] = useState<any>(null);

  return (
    <SmartAccountContext.Provider value={{ smartAccount, setSmartAccount }}>
      {children}
    </SmartAccountContext.Provider>
  );
};
