import React, { useState, useCallback, useEffect } from 'react';

interface CellProps {
  letter: string;
  isHighlighted: boolean;
  isFocused: boolean;
  wordNumbers: number[];
  isCorrect: boolean | null;
  position: { x: number; y: number };
  onClick: () => void;
}

const Cell: React.FC<CellProps> = ({
  letter, isHighlighted, isFocused, wordNumbers, isCorrect, position, onClick
}) => (
  <div
    className={`absolute w-[50px] h-[50px] border border-black flex items-center justify-center cursor-pointer
      ${isHighlighted ? 'bg-yellow-200' : isFocused ? 'bg-blue-100' : 'bg-white'}
      ${isCorrect === true ? 'text-green-600' : isCorrect === false ? 'text-red-600' : ''}`} // for debugging
    style={{
      left: `${position.x * 50}px`,
      top: `${position.y * 50}px`,
    }}
    onClick={onClick}
  >
    {letter}
    {wordNumbers.map((num, index) => (
      <span className={`absolute text-xs ${index === 0 ? 'top-0 left-1' : 'top-1 left-0'}`}>
        {num}
      </span>
    ))}
  </div>
);

interface WordProps {
  id: number;
  cells: string[];
  position: { x: number; y: number };
  direction: 'across' | 'down';
  isFocused: boolean;
  highlightedIndex: number;
  correctWord: string;
  onCellClick: (wordId: number, cellIndex: number) => void;
}

const Word: React.FC<WordProps> = ({
  id, cells, position, direction, isFocused, highlightedIndex, correctWord, onCellClick
}) => (
  <>
    {cells.map((letter, index) => {
      const cellPosition = {
        x: position.x + (direction === 'across' ? index : 0),
        y: position.y + (direction === 'down' ? index : 0)
      };
      return (
        <Cell
          key={`${id}-${index}`}
          letter={letter}
          isHighlighted={isFocused && index === highlightedIndex}
          isFocused={isFocused}
          wordNumbers={index === 0 ? [id] : []}
          isCorrect={letter ? letter.toLowerCase() === correctWord[index].toLowerCase() : null}
          onClick={() => onCellClick(id, index)}
          position={cellPosition}
        />
      );
    })}
  </>
);

type WordItem = {
  id: number;
  word: string;
  position: { x: number; y: number };
  direction: 'across' | 'down';
  clue: string;
};

interface CrosswordGridProps {
  words: WordItem[];
  rows: number;
  cols: number;
}

const CrosswordGrid: React.FC<CrosswordGridProps> = ({ words, rows, cols }) => {
  const [focusedWordId, setFocusedWordId] = useState<number | null>(null);
  const [highlightedCellIndex, setHighlightedCellIndex] = useState<number>(0);
  const [grid, setGrid] = useState<string[][]>(
    Array(rows).fill(null).map(() => Array(cols).fill(''))
  );

  const handleCellClick = useCallback((wordId: number, cellIndex: number) => {
    setFocusedWordId(prevId => {
      if (prevId === wordId) {
        const word = words.find(w => w.id === wordId);
        if (word) {
          return word.direction === 'across' ?
            words.find(w => w.direction === 'down' && w.position.x === word.position.x + cellIndex && w.position.y === word.position.y)?.id ?? wordId :
            words.find(w => w.direction === 'across' && w.position.x === word.position.x && w.position.y === word.position.y + cellIndex)?.id ?? wordId;
        }
      }
      return wordId;
    });
    setHighlightedCellIndex(cellIndex);
  }, [words]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (focusedWordId === null) return;

    const word = words.find(w => w.id === focusedWordId);
    if (!word) return;

    if (/^[a-zA-Z]$/.test(event.key)) {
      const newGrid = [...grid];
      const { x, y } = word.position;
      const dx = word.direction === 'across' ? 1 : 0;
      const dy = word.direction === 'down' ? 1 : 0;

      newGrid[y + dy * highlightedCellIndex][x + dx * highlightedCellIndex] = event.key.toUpperCase();
      setGrid(newGrid);

      if (highlightedCellIndex < word.word.length - 1) {
        setHighlightedCellIndex(highlightedCellIndex + 1);
      }
    } else if (event.key === 'Backspace') {
      const newGrid = [...grid];
      const { x, y } = word.position;
      const dx = word.direction === 'across' ? 1 : 0;
      const dy = word.direction === 'down' ? 1 : 0;

      newGrid[y + dy * highlightedCellIndex][x + dx * highlightedCellIndex] = '';
      setGrid(newGrid);

      if (highlightedCellIndex > 0) {
        setHighlightedCellIndex(highlightedCellIndex - 1);
      }
    }
  }, [focusedWordId, highlightedCellIndex, words, grid]);

  const checkAnswer = useCallback(() => {
    
  }, []);

  const getCurrentClue = useCallback(() => {
    if (focusedWordId === null) return '';
    const word = words.find(w => w.id === focusedWordId);
    return word ? `${word.id}. ${word.direction.charAt(0).toUpperCase() + word.direction.slice(1)}: ${word.clue}` : '';
  }, [focusedWordId, words]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        const currentIndex = words.findIndex(w => w.id === focusedWordId);
        const nextIndex = (currentIndex + 1) % words.length;
        setFocusedWordId(words[nextIndex].id);
        setHighlightedCellIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [focusedWordId, words]);

  return (
    <div className="flex flex-col items-center">
      <div
        className="bg-black p-4 mt-0 mb-4"
        style={{ width: `${cols * 50 + 32}px`, height: `${rows * 50 + 32}px` }}
        tabIndex={0}
        onKeyDown={handleKeyPress}
      >
        {words.map(word => (
          <Word
            key={word.id}
            id={word.id}
            cells={word.word.split('').map((_, i) => grid[word.position.y + (word.direction === 'down' ? i : 0)][word.position.x + (word.direction === 'across' ? i : 0)])}
            position={word.position}
            direction={word.direction}
            isFocused={focusedWordId === word.id}
            highlightedIndex={highlightedCellIndex}
            onCellClick={handleCellClick}
            correctWord={word.word}
          />
        ))}
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const words: WordItem[] = [
    { id: 1, word: 'THE', position: { x: 0, y: 0 }, direction: 'across', clue: 'Test Clue Text' },
    { id: 2, word: 'PRIME', position: { x: 10, y: 10 }, direction: 'down', clue: 'Top Text' },
    { id: 3, word: 'AGEN', position: { x: 20, y: 20 }, direction: 'across', clue: 'Bottom Text' },
    { id: 4, word: 'FOO', position: { x: 15, y: 10 }, direction: 'down', clue: 'Test Clue Text' },
    { id: 5, word: 'BAR', position: { x: 30, y: 5 }, direction: 'across', clue: 'Test Clue Text' },
    { id: 6, word: 'FIZZ', position: { x: 0, y: 35 }, direction: 'across', clue: 'Test Clue Text' },
    { id: 7, word: 'FUZZ', position: { x: 20, y: 5 }, direction: 'across', clue: 'Test Clue Text' },
    { id: 8, word: 'AAAAA', position: { x: 0, y: 25 }, direction: 'across', clue: 'Test Clue Text' },
    { id: 9, word: 'BBBBB', position: { x: 0, y: 5 }, direction: 'across', clue: 'Test Clue Text' },
    { id: 10, word: 'CCCCC', position: { x: 0, y: 5 }, direction: 'across', clue: 'Test Clue Text' },
  ];

  return (
    <div>
      <CrosswordGrid words={words} rows={50} cols={60} />
    </div>
  );
};

export default App;