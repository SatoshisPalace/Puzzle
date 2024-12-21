import {
  Box,
  Card,
  CardBody,
  VStack,
  Heading,
  Badge,
  Image,
  Text,
  useColorModeValue,
  AspectRatio,
  Skeleton
} from '@chakra-ui/react';
import { DEFAULT_BANNER } from '../../config/constants';
import { Puzzle } from '../../blockchain/puzzleOperations';

interface PuzzleCardProps {
  puzzle: Partial<Puzzle>;
  showDetails?: boolean;
  onClick?: () => void;
  isLoading?: boolean;
}

export const PuzzleCard = ({ puzzle, showDetails = false, onClick, isLoading = false }: PuzzleCardProps) => {
  const bgColor = useColorModeValue('gray.50', 'gray.700');

  if (isLoading) {
    return (
      <Card maxW="100%" mx="auto">
        <Skeleton height="300px" />
        <CardBody>
          <VStack spacing={4}>
            <Skeleton height="20px" width="80%" />
            <Skeleton height="20px" width="60%" />
          </VStack>
        </CardBody>
      </Card>
    );
  }

  const isYouTubeUrl = (url: string): boolean => {
    return url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i) !== null;
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url;
  };

  const renderMediaContent = (type: string, url: string) => {
    switch (type) {
      case 'picture':
        return (
          <AspectRatio ratio={16/9}>
            <Image
              src={url}
              alt="Question media"
              objectFit="cover"
              w="100%"
              borderRadius="md"
            />
          </AspectRatio>
        );
      case 'video':
        if (isYouTubeUrl(url)) {
          return (
            <AspectRatio ratio={16/9}>
              <iframe
                src={getYouTubeEmbedUrl(url)}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ borderRadius: '0.375rem' }}
              />
            </AspectRatio>
          );
        }
        return (
          <AspectRatio ratio={16/9}>
            <video
              src={url}
              controls
              style={{ width: '100%', borderRadius: '0.375rem' }}
            />
          </AspectRatio>
        );
      case 'iframe':
        return (
          <AspectRatio ratio={16/9}>
            <iframe
              src={url}
              style={{ width: '100%', borderRadius: '0.375rem' }}
              allowFullScreen
            />
          </AspectRatio>
        );
      default:
        return null;
    }
  };

  return (
    <Card 
      w="100%" 
      variant="outline"
      transition="transform 0.2s"
      _hover={onClick ? { transform: 'translateY(-4px)', cursor: 'pointer' } : undefined}
      onClick={onClick}
    >
      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* Banner Image */}
          <AspectRatio ratio={16/9}>
            <Image
              src={puzzle.bannerImage || DEFAULT_BANNER}
              alt={puzzle.name}
              objectFit="cover"
              borderRadius="md"
            />
          </AspectRatio>

          {/* Title and Reward */}
          <VStack spacing={2} align="stretch">
            <Heading size="lg">{puzzle.name}</Heading>
            {puzzle.reward && (
              <Text color="green.500" fontWeight="bold">
                Reward: {puzzle.reward}
              </Text>
            )}
          </VStack>

          {/* Questions */}
          {showDetails && puzzle.questions.map((question, index) => (
            <Box key={index}>
              <Text fontWeight="bold" mb={4}>
                Question {index + 1}:
              </Text>
              <VStack spacing={4} align="stretch">
                {question.mediaUrl && renderMediaContent(question.type, question.mediaUrl)}
                <Text>{question.content}</Text>
              </VStack>
            </Box>
          ))}
        </VStack>
      </CardBody>
    </Card>
  );
};
