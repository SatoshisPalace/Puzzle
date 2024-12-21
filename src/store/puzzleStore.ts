import { create } from 'zustand';
import { PuzzleState, Puzzle, PuzzleAttempt } from '../types/puzzle';

export const usePuzzleStore = create<PuzzleState>((set) => ({
  puzzles: [],
  addPuzzle: (newPuzzle) => 
    set((state) => ({
      puzzles: [...state.puzzles, { ...newPuzzle, id: crypto.randomUUID(), isActive: true }]
    })),
  updatePuzzle: (id, updatedPuzzle) =>
    set((state) => ({
      puzzles: state.puzzles.map((puzzle) =>
        puzzle.id === id ? { ...puzzle, ...updatedPuzzle } : puzzle
      )
    })),
  deletePuzzle: (id) =>
    set((state) => ({
      puzzles: state.puzzles.filter((puzzle) => puzzle.id !== id)
    })),
  attemptPuzzle: (attempt) => {
    let isCorrect = false;
    set((state) => {
      const puzzle = state.puzzles.find((p) => p.id === attempt.puzzleId);
      if (puzzle) {
        isCorrect = puzzle.answers.every((answer, index) => 
          answer.toLowerCase() === attempt.answers[index]?.toLowerCase()
        );
      }
      return state;
    });
    return isCorrect;
  }
}));
