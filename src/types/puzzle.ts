export interface QuestionContent {
  type: 'text' | 'image' | 'video' | 'iframe';
  content: string;
}

export interface Puzzle {
  id: string;
  name: string;
  reward?: string;
  questions: QuestionContent[];
  answers: string[];
  isActive: boolean;
}

export interface PuzzleAttempt {
  puzzleId: string;
  answers: string[];
}

export interface PuzzleState {
  puzzles: Puzzle[];
  addPuzzle: (puzzle: Omit<Puzzle, 'id' | 'isActive'>) => void;
  updatePuzzle: (id: string, puzzle: Partial<Puzzle>) => void;
  deletePuzzle: (id: string) => void;
  attemptPuzzle: (attempt: PuzzleAttempt) => boolean;
}
