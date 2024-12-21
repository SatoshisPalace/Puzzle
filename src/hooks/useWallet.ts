import { useState, useEffect } from 'react';

export interface WalletState {
  wallet: string | null;
  connecting: boolean;
  error: string | null;
}

export const useWallet = () => {
  const [state, setState] = useState<WalletState>({
    wallet: null,
    connecting: false,
    error: null,
  });

  useEffect(() => {
    // Check if wallet exists in localStorage
    const savedWallet = localStorage.getItem('userWallet');
    if (savedWallet) {
      setState(prev => ({ ...prev, wallet: savedWallet }));
    }
  }, []);

  const connect = async () => {
    setState(prev => ({ ...prev, connecting: true, error: null }));
    try {
      // For now, we'll just use a mock wallet for testing
      // In production, this would integrate with ArConnect or other wallet providers
      const mockWallet = 'mock-wallet-' + Math.random().toString(36).substring(7);
      localStorage.setItem('userWallet', mockWallet);
      setState(prev => ({ ...prev, wallet: mockWallet, connecting: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        connecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet'
      }));
    }
  };

  const disconnect = () => {
    localStorage.removeItem('userWallet');
    setState({
      wallet: null,
      connecting: false,
      error: null
    });
  };

  return {
    ...state,
    connect,
    disconnect,
    isConnected: !!state.wallet
  };
};
