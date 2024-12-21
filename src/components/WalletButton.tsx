import { Button, useToast } from '@chakra-ui/react';
import { useWallet } from '../hooks/useWallet';

export const WalletButton = () => {
  const { wallet, connecting, connect, disconnect, isConnected } = useWallet();
  const toast = useToast();

  const handleClick = async () => {
    if (isConnected) {
      disconnect();
      toast({
        title: 'Disconnected',
        description: 'Wallet has been disconnected',
        status: 'info',
      });
    } else {
      try {
        await connect();
        toast({
          title: 'Connected',
          description: 'Wallet has been connected',
          status: 'success',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to connect wallet',
          status: 'error',
        });
      }
    }
  };

  return (
    <Button
      onClick={handleClick}
      isLoading={connecting}
      colorScheme={isConnected ? 'green' : 'blue'}
    >
      {isConnected ? `Connected: ${wallet?.slice(0, 6)}...` : 'Connect Wallet'}
    </Button>
  );
};
