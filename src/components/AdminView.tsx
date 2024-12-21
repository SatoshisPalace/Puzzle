import { useState } from 'react';
import {
  Box,
  Button,
  Input,
  VStack,
  Text,
  Select,
  useToast,
  Textarea,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  Container,
  Card,
  CardBody,
  Divider,
  useBreakpointValue,
  useColorModeValue,
  Grid,
  GridItem,
  Image,
  Badge,
} from '@chakra-ui/react';
import { postPuzzle, getAdmins, addAdmin } from '../blockchain/puzzleOperations';
import { DEFAULT_BANNER, GAME_CONFIG } from '../config/constants';
import { useWalletContext } from '../components/Wallet/WalletContext';
import { PuzzleCard } from './PuzzleCard/PuzzleCard';

export const AdminView = () => {
  const [questions, setQuestions] = useState<Array<{ type: string; content: string; mediaUrl?: string }>>([{ type: 'text', content: '' }]);
  const [answers, setAnswers] = useState<string[]>(['']);
  const [name, setName] = useState('');
  const [reward, setReward] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [newAdmin, setNewAdmin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAdmins, setIsCheckingAdmins] = useState(false);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const toast = useToast();
  const { wallet } = useWalletContext();

  const isMobile = useBreakpointValue({ base: true, lg: false });
  const bg = useColorModeValue('gray.50', 'gray.900');
  const previewBg = useColorModeValue('white', 'gray.800');

  const handleCheckAdmins = async () => {
    setIsCheckingAdmins(true);
    try {
      const admins = await getAdmins();
      console.log('Got admin list:', admins);
      toast({
        title: 'Current Admins',
        description: admins.length > 0 
          ? admins.map((admin, i) => `${i + 1}. ${admin}`).join('\n')
          : 'No admins found',
        status: 'info',
        duration: 10000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get admins',
        status: 'error',
      });
    } finally {
      setIsCheckingAdmins(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        status: 'error',
      });
      return;
    }

    if (!newAdmin) {
      toast({
        title: 'Error',
        description: 'Please enter an admin address',
        status: 'error',
      });
      return;
    }

    setIsAddingAdmin(true);
    try {
      await addAdmin(newAdmin, wallet);
      toast({
        title: 'Success',
        description: 'Admin added successfully',
        status: 'success',
      });
      setNewAdmin('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add admin',
        status: 'error',
      });
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleQuestionChange = (index: number, field: string, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const addQuestionAnswer = () => {
    setQuestions([...questions, { type: 'text', content: '' }]);
    setAnswers([...answers, '']);
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

    if (questions.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one question',
        status: 'error',
      });
      return;
    }

    if (questions.some(q => !q.content.trim())) {
      toast({
        title: 'Error',
        description: 'All questions must have content',
        status: 'error',
      });
      return;
    }

    if (answers.some(a => !a.trim())) {
      toast({
        title: 'Error',
        description: 'All questions must have answers',
        status: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Join all answers with commas for the hash
      const answersString = answers.join(',');
      await postPuzzle(
        name,
        questions,
        [answersString], // Pass the combined answers string
        reward,
        bannerImage,
        wallet
      );
      toast({
        title: 'Success',
        description: 'Puzzle created successfully!',
        status: 'success',
      });
      // Reset form
      setName('');
      setBannerImage('');
      setReward('');
      setQuestions([]);
      setAnswers([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create puzzle',
        status: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box w="100%" h="100%" overflow="hidden" display="grid" gridTemplateColumns="50% 50%" position="relative">
      {/* Admin Form Section */}
      <Box 
        p={8} 
        overflowY="auto" 
        borderRight="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        w="100%"
        h="100%"
      >
        <VStack spacing={8} align="stretch" pb={8} w="100%">
          {/* Admin Management Section */}
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md">Admin Management</Heading>
                <VStack spacing={4} align="stretch">
                  <Button
                    colorScheme="blue"
                    onClick={handleCheckAdmins}
                    isLoading={isCheckingAdmins}
                    w="100%"
                    size="lg"
                  >
                    Check Admins
                  </Button>
                  <form onSubmit={handleAddAdmin} style={{ width: '100%' }}>
                    <VStack spacing={4}>
                      <Input
                        placeholder="Admin Address"
                        value={newAdmin}
                        onChange={(e) => setNewAdmin(e.target.value)}
                        size="lg"
                      />
                      <Button
                        type="submit"
                        colorScheme="green"
                        isLoading={isAddingAdmin}
                        w="100%"
                        size="lg"
                      >
                        Add Admin
                      </Button>
                    </VStack>
                  </form>
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          <Divider />

          {/* Puzzle Creation Form */}
          <Card>
            <CardBody>
              <form onSubmit={handleSubmit}>
                <VStack spacing={6} align="stretch">
                  <Heading size="md">Create New Puzzle</Heading>
                  
                  <FormControl isRequired>
                    <FormLabel>Puzzle Name</FormLabel>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter puzzle name"
                      size="lg"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Banner Image URL</FormLabel>
                    <Input
                      value={bannerImage}
                      onChange={(e) => setBannerImage(e.target.value)}
                      placeholder="Enter banner image URL"
                      size="lg"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Reward</FormLabel>
                    <Input
                      value={reward}
                      onChange={(e) => setReward(e.target.value)}
                      placeholder="Enter reward (optional)"
                      size="lg"
                    />
                  </FormControl>

                  {questions.map((question, index) => (
                    <Card key={index} variant="outline">
                      <CardBody>
                        <VStack spacing={4}>
                          <FormControl isRequired>
                            <FormLabel>Question Type</FormLabel>
                            <Select
                              value={question.type}
                              onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}
                              size="lg"
                            >
                              <option value="text">Text Only</option>
                              <option value="picture">Picture with Text</option>
                              <option value="video">Video with Text</option>
                              <option value="iframe">iFrame with Text</option>
                            </Select>
                          </FormControl>

                          <FormControl isRequired>
                            <FormLabel>Question Content</FormLabel>
                            <VStack spacing={4} align="stretch">
                              <Textarea
                                value={question.content}
                                onChange={(e) => handleQuestionChange(index, 'content', e.target.value)}
                                placeholder="Enter your question text"
                                size="lg"
                                minH="100px"
                              />
                              {question.type !== 'text' && (
                                <Input
                                  placeholder={
                                    question.type === 'picture' ? "Enter image URL" :
                                    question.type === 'video' ? "Enter video URL" :
                                    "Enter iFrame URL"
                                  }
                                  value={question.mediaUrl || ''}
                                  onChange={(e) => handleQuestionChange(index, 'mediaUrl', e.target.value)}
                                  size="lg"
                                />
                              )}
                            </VStack>
                          </FormControl>

                          <FormControl isRequired>
                            <FormLabel>Answer</FormLabel>
                            <Input
                              value={answers[index] || ''}
                              onChange={(e) => {
                                const newAnswers = [...answers];
                                newAnswers[index] = e.target.value;
                                setAnswers(newAnswers);
                              }}
                              placeholder="Enter the answer"
                              size="lg"
                            />
                          </FormControl>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}

                  <HStack spacing={4} justify="space-between">
                    <Button
                      onClick={addQuestionAnswer}
                      colorScheme="blue"
                      disabled={questions.length >= GAME_CONFIG.MAX_QUESTIONS}
                      size="lg"
                      flex={1}
                    >
                      Add Question
                    </Button>
                    <Button
                      type="submit"
                      colorScheme="green"
                      isLoading={isSubmitting}
                      loadingText="Creating..."
                      size="lg"
                      flex={1}
                    >
                      Create Puzzle
                    </Button>
                  </HStack>
                </VStack>
              </form>
            </CardBody>
          </Card>
        </VStack>
      </Box>

      {/* Preview Section */}
      <Box 
        p={8} 
        overflowY="auto"
        bg={useColorModeValue('gray.50', 'gray.900')}
        borderLeft="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        w="100%"
        h="100%"
      >
        <VStack spacing={4} align="stretch" w="100%">
          <Heading size="md">Preview</Heading>
          <Box w="100%">
            <PuzzleCard
              puzzle={{
                name,
                bannerImage,
                reward,
                questions: questions.map((q, i) => ({
                  ...q,
                  answer: answers[i] || ''
                }))
              }}
              showDetails={true}
            />
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};
