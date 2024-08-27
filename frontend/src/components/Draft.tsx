import React, { useState, useCallback, useEffect } from 'react';

type WordData = {
    id: number;
    correctWord: string;
    position: { x: number; y: number };
    direction: 'across' | 'down';
    clue: string;
};

interface Cell {
    letter: string;
    isHighlighted: boolean;
    isFocused: boolean;
    wordIDs: number[];
    isCorrect: boolean | null;
    position: { x: number; y: number };
    onClick: () => void;
}

interface CellProps {
    letter: string;
    isHighlighted: boolean;
    isFocused: boolean;
    wordIDs: number[];
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
    letter, isHighlighted, isFocused, wordIDs, isCorrect, position, onClick
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
        {wordIDs.map((num, index) => (
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
    const [hasBeenCorrect, setHasBeenCorrect] = useState(false);

    useEffect(() => {
        if (guessStatus.every(Boolean) && !hasBeenCorrect) {
            setHasBeenCorrect(true);
            onWordCorrect(id);
        }
    }, [guessStatus]);

    return (
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
                        wordIDs={index === 0 ? [id] : []}
                        // isCorrect={letter ? letter.toLowerCase() === correctWord[index].toLowerCase() : null}
                        isCorrect={guessStatus.every(Boolean)}
                        onClick={() => onCellClick(id, index)}
                        position={cellPosition}
                    />
                );
            })}
        </>
    );
}

function Words2Cells(words: WordData[]): Cell[][] {
    const cellGrid = Array(30).fill(null).map(() => Array(30).fill(null));
    words.forEach(word => {
        const { x, y } = word.position;
        if (cellGrid[y][x] !== null) {
            for (let i = 0; i < word.correctWord.length; i++) {
                cellGrid[y + (word.direction === 'down' ? i : 0)][x + (word.direction === 'across' ? i : 0)] = {
                    letter: word.correctWord[i],
                    isHighlighted: false,
                    isFocused: false,
                    wordIDs: [word.id],
                    isCorrect: null,
                    position: { x: x + (word.direction === 'across' ? i : 0), y: y + (word.direction === 'down' ? i : 0) },
                    onClick: () => { }
                };
            }
        }
        else if (cellGrid[y][x].wordIDs.length == 1) {
            cellGrid[y][x].wordIDs.push(word.id);
        }
    });
    return cellGrid;
}

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
    const [cellsGrid, setCellsGrid] = useState<Cell[]>(
        []
    );
    const [answerGrid, setAnswerGrid] = useState<Cell[]>(
        []
    );
    const [corpus, setCorpus] = useState([
        { correctWord: "side", clue: "abcd" },
        { correctWord: "blue", clue: "bcdd" },
        { correctWord: "cake", clue: "dabc" },
        { correctWord: "time", clue: "cdda" },
        { correctWord: "lamp", clue: "adcc" },
        { correctWord: "fork", clue: "dbbc" },
        { correctWord: "rain", clue: "cbad" },
        { correctWord: "tree", clue: "ddcb" },
        { correctWord: "note", clue: "bada" },
        { correctWord: "wind", clue: "dacd" },
        { correctWord: "milk", clue: "bcad" },
        { correctWord: "rope", clue: "acdb" },
        { correctWord: "moon", clue: "cdba" },
        { correctWord: "book", clue: "abdc" },
        { correctWord: "sand", clue: "bdca" },
        { correctWord: "fire", clue: "dabc" },
        { correctWord: "star", clue: "cadd" },
        { correctWord: "fish", clue: "bacd" },
        { correctWord: "ball", clue: "cddb" },
        { correctWord: "leaf", clue: "adbd" },
        { correctWord: "wolf", clue: "dcba" },
        { correctWord: "ship", clue: "cadb" },
    ]);


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
        let message = ""
        gridTaken.forEach(row => {
            row.forEach(element => {
                message += element ? 'X' : ' '
            });
            message += "\n"
        });
        console.log(message)
    }, [words]);

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
        const correctWordData = words.find(word => word.id === wordId);
        if (!correctWordData) return;
        // if across, then go down, y increase
        const dx = correctWordData?.direction === 'across' ? 0 : 1;
        const dy = correctWordData?.direction === 'down' ? 0 : 1;
        let newCorrectWord = "XXXXXX"
        let randomOffset = 0
        let crossIndex = 0
        let searchComplete = false;
        corpus.forEach((word, clue) => {
            if (searchComplete) return;
            for (randomOffset = 1; randomOffset < word.correctWord.length; randomOffset++) {
                indexLoop: for (crossIndex = 0; crossIndex < newCorrectWord.length; crossIndex++) {
                    if (correctWordData.correctWord[randomOffset] === word.correctWord.toUpperCase()[crossIndex]) {
                        for (let i = 0; i < word.correctWord.length; i++) {
                            // if having conflict with other words
                            console.log("original word at" + (correctWordData.position.y) + " " + (correctWordData.position.x))
                            console.log("conflict at" + (correctWordData.position.y + dx * randomOffset + dy * (i - crossIndex)) + " " + (correctWordData.position.x + dy * randomOffset + dx * (i - crossIndex)))
                            if (i !== crossIndex && gridTaken[correctWordData.position.y + dx * randomOffset + dy * (i - crossIndex)][correctWordData.position.x + dy * randomOffset + dx * (i - crossIndex)]) {
                                console.log("conflict")
                                break indexLoop;
                            }
                        }

                        newCorrectWord = word.correctWord.toUpperCase();
                        searchComplete = true;
                        break;
                    }
                }
                if (searchComplete) break;
            }
        });
        // const randomOffset = Math.ceil(Math.random() * (correctWordData.correctWord.length - 1));

        setCorpus(prevCorpus => prevCorpus.filter(({ correctWord }) => correctWord.toUpperCase() !== newCorrectWord));
        console.log(newCorrectWord)
        console.log(correctWordData.position.y + randomOffset * dy - crossIndex * dx)
        console.log(correctWordData.position.x + randomOffset * dx - crossIndex * dy)


        const newWord: WordData =
        {
            id: wordId + 10,
            correctWord: newCorrectWord,
            position:
            {
                x: correctWordData.position.x + randomOffset * dy - crossIndex * dx,
                y: correctWordData.position.y + randomOffset * dx - crossIndex * dy
            },
            direction: correctWordData?.direction === 'across' ? 'down' : 'across',
            clue: 'Test Clue Text'
        }

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
                <>
                    {Words2Cells(words).map(cells => {
                        cells.map(cell => {
                            <Cell
                                key={`${cell.position.x}-${cell.position.y}`}
                                letter={cell.letter}
                                isHighlighted={cell.isHighlighted}
                                isFocused={cell.isFocused}
                                wordIDs={cell.wordIDs}
                                isCorrect={cell.isCorrect}
                                position={cell.position}
                                onClick={cell.onClick}
                            />

                        })
                    }
                    )
                    }
                </>

            </div>
        </div>
    );
};


const App: React.FC = () => {
    const words: WordData[] = [
        { id: 2, correctWord: 'PRIME', position: { x: 5, y: 5 }, direction: 'down', clue: 'Top Text' },
    ];

    return (
        <div>
            <CrosswordGrid initialWords={words} rows={30} cols={30} />
        </div>
    );
};

export default App;

// todo: handle overlap
// todo: generate corpus
// todo: show clue
// todo: refactor the cell managing logic, one cell at one place. Perhaps render directly by grid