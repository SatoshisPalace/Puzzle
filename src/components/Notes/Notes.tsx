import { Box, Textarea, Text, useColorModeValue } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

interface NotesProps {
  puzzleId: string;
  puzzleName: string;
}

const Notes: React.FC<NotesProps> = ({ puzzleId, puzzleName }) => {
  const [notes, setNotes] = useState('');
  const bgColor = useColorModeValue('white', 'gray.700');

  // Load notes from localStorage when puzzle changes
  useEffect(() => {
    const savedNotes = localStorage.getItem(`puzzle_notes_${puzzleId}`);
    if (savedNotes) {
      setNotes(savedNotes);
    } else {
      setNotes(''); // Clear notes if none exist for this puzzle
    }
  }, [puzzleId]);

  // Save notes to localStorage when they change
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    localStorage.setItem(`puzzle_notes_${puzzleId}`, newNotes);
  };

  return (
    <Box h="100%" display="flex" flexDirection="column">
      <Text mb={4} fontWeight="bold" fontSize="lg">
        Notes for: {puzzleName}
      </Text>
      <Textarea
        value={notes}
        onChange={handleNotesChange}
        placeholder="Type your notes here..."
        size="lg"
        flex="1"
        bg={bgColor}
        resize="none"
        minH="200px"
        h="100%"
        p={4}
        borderRadius="md"
        sx={{
          '&::-webkit-scrollbar': {
            width: '8px',
            borderRadius: '8px',
            backgroundColor: `rgba(0, 0, 0, 0.05)`,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: `rgba(0, 0, 0, 0.2)`,
            borderRadius: '8px',
          },
        }}
      />
    </Box>
  );
};

export default Notes;
