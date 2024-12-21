import {
  Box,
  Text,
  useToast,
  Container,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  VStack,
  useColorModeValue,
  Skeleton,
  Heading,
  useBreakpointValue,
  useDisclosure,
  Grid,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { getPuzzles, solvePuzzle } from '../blockchain/puzzleOperations';
import { useWalletContext } from './Wallet/WalletContext';
import { Puzzle } from '../blockchain/puzzleOperations';
import { DEFAULT_BANNER } from '../config/constants';
import { PuzzleCard } from './PuzzleCard/PuzzleCard';
import Notes from './Notes/Notes';

export const PlayerView = () => {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPuzzle, setSelectedPuzzle] = useState<Puzzle | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { wallet } = useWalletContext();
  const bg = useColorModeValue('gray.50', 'gray.900');

  const columns = useBreakpointValue({ base: 1, md: 2, lg: 3, xl: 4 });

  useEffect(() => {
    fetchPuzzles();
  }, []);

  useEffect(() => {
    // Reset answers when puzzle changes
    if (selectedPuzzle) {
      setAnswers(new Array(selectedPuzzle.questions.length).fill(''));
    }
  }, [selectedPuzzle]);

  const fetchPuzzles = async () => {
    setLoading(true);
    try {
      const puzzlesData = await getPuzzles();
      setPuzzles(puzzlesData);
    } catch (error) {
      console.error('Error fetching puzzles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch puzzles',
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!wallet) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        status: 'error',
      });
      return;
    }

    if (!selectedPuzzle) return;

    // Check if all answers are filled
    if (answers.some(answer => !answer.trim())) {
      toast({
        title: 'Error',
        description: 'Please answer all questions',
        status: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Join all answers with commas
      const answersString = answers.join(',');
      await solvePuzzle(selectedPuzzle.id, [answersString], wallet);
      toast({
        title: 'Success',
        description: 'Puzzle solved successfully!',
        status: 'success',
      });
      // Clear answers
      setAnswers(new Array(selectedPuzzle.questions.length).fill(''));
      // Refresh puzzles
      await fetchPuzzles();
      // Close modal
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to solve puzzle',
        status: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handlePuzzleClick = (puzzle: Puzzle) => {
    setSelectedPuzzle(puzzle);
    onOpen();
  };

  return (
    <Box flex="1" overflow="hidden" display="flex" flexDirection="column" w="100%">
      <Box
        p={4}
        bg={useColorModeValue('white', 'gray.800')}
        borderBottom="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <Container maxW="100%" px={4}>
          <Heading size="lg">Available Puzzles</Heading>
        </Container>
      </Box>

      <Box flex="1" overflowY="auto" w="100%">
        <Container maxW="100%" px={4}>
          {/* Puzzle Grid */}
          <Box p={8}>
            <SimpleGrid
              columns={columns}
              spacing={8}
              w="100%"
            >
              {loading ? (
                // Loading skeletons
                Array(6).fill(0).map((_, i) => (
                  <Skeleton key={i} height="400px" borderRadius="lg" />
                ))
              ) : puzzles.length === 0 ? (
                <Text>No puzzles available</Text>
              ) : (
                puzzles.map((puzzle) => (
                  <Box
                    key={puzzle.id}
                    onClick={() => handlePuzzleClick(puzzle)}
                    cursor="pointer"
                    transition="transform 0.2s"
                    _hover={{ transform: 'translateY(-4px)' }}
                  >
                    <PuzzleCard
                      puzzle={puzzle}
                      showDetails={false}
                    />
                  </Box>
                ))
              )}
            </SimpleGrid>
          </Box>
        </Container>
      </Box>

      {/* Puzzle Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="full">
        <ModalOverlay />
        <ModalContent maxW="100vw" minH="100vh" m={0} bg={useColorModeValue('gray.50', 'gray.900')}>
          <ModalHeader
            borderBottom="1px"
            borderColor={useColorModeValue('gray.200', 'gray.700')}
          >
            {selectedPuzzle?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p={0} display="flex" flexDirection="column" flex="1">
            <Grid templateColumns="70% 30%" flex="1" minH="calc(100vh - 60px)">
              {/* Puzzle Content */}
              <Box p={8} overflowY="auto" borderRight="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>
                <Container maxW="80%" h="100%">
                  {selectedPuzzle && (
                    <VStack spacing={6} align="stretch">
                      <PuzzleCard
                        puzzle={selectedPuzzle}
                        showDetails={true}
                      />
                      <form onSubmit={handleSubmit}>
                        <VStack spacing={6} align="stretch">
                          {selectedPuzzle.questions.map((question, index) => (
                            <Box key={index}>
                              <Text mb={2} fontWeight="bold">Answer for Question {index + 1}:</Text>
                              <Input
                                placeholder={`Enter answer for question ${index + 1}`}
                                value={answers[index] || ''}
                                onChange={(e) => handleAnswerChange(index, e.target.value)}
                                size="lg"
                              />
                            </Box>
                          ))}
                          <Button
                            type="submit"
                            colorScheme="blue"
                            size="lg"
                            isLoading={isSubmitting}
                            w="100%"
                          >
                            Submit Answers
                          </Button>
                        </VStack>
                      </form>
                    </VStack>
                  )}
                </Container>
              </Box>

              {/* Notes Section */}
              <Box p={8} bg={useColorModeValue('white', 'gray.800')} h="100%" overflowY="auto">
                {selectedPuzzle && (
                  <Notes
                    puzzleId={selectedPuzzle.id}
                    puzzleName={selectedPuzzle.name}
                  />
                )}
              </Box>
            </Grid>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};
