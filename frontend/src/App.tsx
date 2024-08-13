import React, { useState, useCallback, useEffect } from 'react';

type WordData = {
  id: number;
  correctWord: string;
  position: { x: number; y: number };
  direction: 'across' | 'down';
  clue: string;
};

interface CellProps {
  letter: string;
  isHighlighted: boolean;
  isFocused: boolean;
  wordNumbers: number[];
  isCorrect: boolean | null;
  position: { x: number; y: number };
  onClick: () => void;
}

interface WordProps {
  id: number;
  cells: string[];
  position: { x: number; y: number };
  direction: 'across' | 'down';
  isFocused: boolean;
  highlightedIndex: number;
  correctWord: string;
  guessStatus: boolean[];
  onCellClick: (wordId: number, cellIndex: number) => void;
  onWordCorrect: (wordId: number) => void;
}

interface CrosswordGridProps {
  initialWords: WordData[];
  rows: number;
  cols: number;
}

const Cell: React.FC<CellProps> = ({
  letter, isHighlighted, isFocused, wordNumbers, isCorrect, position, onClick
}) => (
  <div
    className={`absolute w-[50px] h-[50px] border border-black flex items-center justify-center cursor-pointer
      ${isHighlighted ? 'bg-yellow-200' : isFocused ? 'bg-blue-100' : 'bg-white'}
      ${isCorrect === true ? 'text-green-600' : 'text-red-600'}`} // for debugging
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



// Word is more like manager than container, cells have absolute position
const Word: React.FC<WordProps> = ({
  id, cells, position, direction, isFocused, highlightedIndex, correctWord, onCellClick, guessStatus, onWordCorrect
}) => {
  useEffect(() => {
    if (guessStatus.every(Boolean)) {
      onWordCorrect(id);
    }
  }, [guessStatus]);

  return(
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
          // isCorrect={letter ? letter.toLowerCase() === correctWord[index].toLowerCase() : null}
          isCorrect={guessStatus.every(Boolean)}
          onClick={() => onCellClick(id, index)}
          position={cellPosition}
        />
      );
    })}
  </>
);}




const CrosswordGrid: React.FC<CrosswordGridProps> = ({ initialWords, rows, cols }) => {
  const [focusedWordId, setFocusedWordId] = useState<number | null>(null);
  const [highlightedCellIndex, setHighlightedCellIndex] = useState<number>(0);
  const [words, setWords] = useState<WordData[]>(initialWords)
  const [grid, setGrid] = useState<string[][]>(
    Array(rows).fill(null).map(() => Array(cols).fill(' '))
  );
  const [gridTaken, setGridTaken] = useState<boolean[][]>(
    Array(rows).fill(null).map(() => Array(cols).fill(false))
  );
  const Corpus = {"abcd":"abcd", "bcdd":"bcdd"}
  useEffect(() => {
    const newGridTaken = Array(rows).fill(null).map(() => Array(cols).fill(''));
    words.forEach(word => {
      const { x, y } = word.position;
      for (let i = 0; i < word.correctWord.length; i++) {
        if (word.direction === 'across') {
          newGridTaken[y][x + i] = true;
        } else {
          newGridTaken[y + i][x] = true;
        }
      }
    });
    setGridTaken(newGridTaken);
  }, [words, rows, cols]);

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

  const handleAddWord = useCallback((wordId: number) => {
    const newWord: WordData = { id: 100, 
      correctWord: 'THE', 
      position: { x: 3, y: 3 }, 
      direction: 'across', 
      clue: 'Test Clue Text' }
    
    setWords([...words, newWord]);
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
      let message = ""
      gridTaken.forEach(row => {
        row.forEach(element => {
          message += element ? 'X' : ' '
        });
        message += "\n"
      });
      console.clear()
      console.log(message)


      if (highlightedCellIndex < word.correctWord.length - 1) {
        setHighlightedCellIndex(highlightedCellIndex + 1);
      }
    } else if (event.key === 'Backspace') {
      const newGrid = [...grid];
      const { x, y } = word.position;
      const dx = word.direction === 'across' ? 1 : 0;
      const dy = word.direction === 'down' ? 1 : 0;

      newGrid[y + dy * highlightedCellIndex][x + dx * highlightedCellIndex] = ' ';
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
            cells={word.correctWord.split('').map((_, i) => grid[word.position.y + (word.direction === 'down' ? i : 0)][word.position.x + (word.direction === 'across' ? i : 0)])}
            guessStatus={word.correctWord.split('').map((char, i) => char === grid[word.position.y + (word.direction === 'down' ? i : 0)][word.position.x + (word.direction === 'across' ? i : 0)])}
            position={word.position}
            direction={word.direction}
            isFocused={focusedWordId === word.id}
            highlightedIndex={highlightedCellIndex}
            onCellClick={handleCellClick}
            correctWord={word.correctWord}
            onWordCorrect={handleAddWord}
          />
        ))}
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const words: WordData[] = [
    { id: 1, correctWord: 'THE', position: { x: 0, y: 0 }, direction: 'across', clue: 'Test Clue Text' },
    { id: 2, correctWord: 'PRIME', position: { x: 10, y: 10 }, direction: 'down', clue: 'Top Text' },
    { id: 3, correctWord: 'AGEN', position: { x: 20, y: 20 }, direction: 'across', clue: 'Bottom Text' },
    { id: 4, correctWord: 'FOO', position: { x: 15, y: 10 }, direction: 'down', clue: 'Test Clue Text' },
    { id: 5, correctWord: 'BAR', position: { x: 3, y: 5 }, direction: 'across', clue: 'Test Clue Text' },
    { id: 6, correctWord: 'FIZZ', position: { x: 0, y: 5 }, direction: 'across', clue: 'Test Clue Text' },
    { id: 7, correctWord: 'FUZZ', position: { x: 2, y: 6 }, direction: 'across', clue: 'Test Clue Text' },
    { id: 8, correctWord: 'AAAAA', position: { x: 5, y: 7 }, direction: 'across', clue: 'Test Clue Text' },
    { id: 9, correctWord: 'BBBBB', position: { x: 6, y: 8 }, direction: 'across', clue: 'Test Clue Text' },
    { id: 10, correctWord: 'CCCCC', position: { x: 7, y: 9 }, direction: 'across', clue: 'Test Clue Text' },
  ];

  return (
    <div>
      <CrosswordGrid initialWords={words} rows={30} cols={30} />
    </div>
  );
};

export default App;