import { Container, Tab, TabList, TabPanel, TabPanels, Tabs, Box, Flex, IconButton, useColorMode } from '@chakra-ui/react'
import { SunIcon, MoonIcon } from '@chakra-ui/icons'
import { AdminView } from './components/AdminView'
import { PlayerView } from './components/PlayerView'
import { WalletProvider } from './components/Wallet/WalletContext'
import WalletConnection from './components/Wallet/WalletConnection'

const NAV_HEIGHT = "80px";
const TAB_HEIGHT = "48px";

function App() {
  const { colorMode, toggleColorMode } = useColorMode()

  return (
    <WalletProvider>
      <Flex direction="column" minH="100vh" w="100vw" overflow="hidden">
        <Flex 
          justifyContent="flex-end" 
          p={6} 
          gap={4} 
          bg={colorMode === 'light' ? 'gray.200' : 'gray.900'} 
          borderBottom="1px" 
          borderColor={colorMode === 'light' ? 'gray.300' : 'gray.700'}
          position="fixed"
          top={0}
          left={0}
          right={0}
          height={NAV_HEIGHT}
          zIndex={1001}
          alignItems="center"
        >
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            size="lg"
          />
          <Box mr={4}>
            <WalletConnection />
          </Box>
        </Flex>

        <Box pt={NAV_HEIGHT} h={`calc(100vh - ${NAV_HEIGHT})`} w="100vw" overflow="hidden">
          <Tabs display="flex" flexDirection="column" h="100%" w="100%">
            <Box 
              bg={colorMode === 'light' ? 'white' : 'gray.800'} 
              borderBottom="1px" 
              borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
              position="sticky"
              top="0"
              height={TAB_HEIGHT}
              minH={TAB_HEIGHT}
              zIndex={1000}
              width="100%"
            >
              <TabList h="100%" w="100%">
                <Tab flex={1}>Play</Tab>
                <Tab flex={1}>Admin</Tab>
              </TabList>
            </Box>
            <TabPanels flex={1} overflow="hidden" h={`calc(100vh - ${NAV_HEIGHT} - ${TAB_HEIGHT})`}>
              <TabPanel h="100%" p={0}>
                <PlayerView />
              </TabPanel>
              <TabPanel h="100%" p={0}>
                <AdminView />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Flex>
    </WalletProvider>
  );
}

export default App;
