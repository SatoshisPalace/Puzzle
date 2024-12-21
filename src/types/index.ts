export interface Puzzle {
  id: string;
  name: string;
  reward?: string;
  questions: string[];
  answers: string[];
  isActive: boolean;
}

export interface PuzzleAttempt {
  puzzleId: string;
  answers: string[];
}

export interface PuzzleState {
  puzzles: Puzzle[];
  addPuzzle: (puzzle: Omit<Puzzle, 'id'>) => void;
  updatePuzzle: (id: string, puzzle: Partial<Puzzle>) => void;
  deletePuzzle: (id: string) => void;
  attemptPuzzle: (attempt: PuzzleAttempt) => boolean;
}
