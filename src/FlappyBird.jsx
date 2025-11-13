import { useState, useEffect, useRef } from "react";
import birdImage from "./assets/FlappyKeven.png";
import topPipeImage from "./assets/Top_Pipe.png";
import bottomPipeImage from "./assets/Bottom_Pipe.png";
import backgroundImage from "./assets/Background.jpg";
import groundImage from "./assets/Ground.png";

const BIRD_SIZE = 50;
const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const GROUND_HEIGHT = 50;
const GRAVITY = 0.5;
const JUMP_STRENGTH = -8;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const PIPE_SPEED = 3;

function FlappyBird() {
  const [birdPosition, setBirdPosition] = useState(250);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [pipes, setPipes] = useState([]);

  const gameLoopRef = useRef();
  const pipeTimerRef = useRef();

  // Handle jump
  const jump = () => {
    if (!gameStarted) {
      setGameStarted(true);
      return;
    }
    if (gameOver) {
      // Restart game
      setBirdPosition(250);
      setBirdVelocity(0);
      setGameOver(false);
      setScore(0);
      setPipes([]);
      setGameStarted(true);
      return;
    }
    setBirdVelocity(JUMP_STRENGTH);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameStarted, gameOver]);

  // Generate pipes
  useEffect(() => {
    if (gameStarted && !gameOver) {
      pipeTimerRef.current = setInterval(() => {
        // Ensure bottom pipe never goes below the ground
        const maxGapTop = GAME_HEIGHT - GROUND_HEIGHT - PIPE_GAP;
        const minGapTop = 50;
        const gapTop = Math.random() * (maxGapTop - minGapTop) + minGapTop;
        setPipes((prev) => [
          ...prev,
          {
            x: GAME_WIDTH,
            gapTop,
            passed: false,
          },
        ]);
      }, 2000);
    }
    return () => clearInterval(pipeTimerRef.current);
  }, [gameStarted, gameOver]);

  // Game loop
  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoopRef.current = setInterval(() => {
        // Update bird position
        setBirdVelocity((v) => v + GRAVITY);
        setBirdPosition((pos) => {
          const newPos = pos + birdVelocity;

          // Check floor/ceiling collision
          if (newPos < 0 || newPos > GAME_HEIGHT - GROUND_HEIGHT - BIRD_SIZE) {
            setGameOver(true);
            setGameStarted(false);
            return pos;
          }

          return newPos;
        });

        // Update pipes
        setPipes((prevPipes) => {
          const newPipes = prevPipes
            .map((pipe) => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
            .filter((pipe) => pipe.x > -PIPE_WIDTH);

          // Check collision with pipes
          newPipes.forEach((pipe) => {
            const birdLeft = 50;
            const birdRight = 50 + BIRD_SIZE;
            const birdTop = birdPosition;
            const birdBottom = birdPosition + BIRD_SIZE;

            const pipeLeft = pipe.x;
            const pipeRight = pipe.x + PIPE_WIDTH;

            // Check if bird is in pipe's x range
            if (birdRight > pipeLeft && birdLeft < pipeRight) {
              // Check if bird hits top or bottom pipe
              if (
                birdTop < pipe.gapTop ||
                birdBottom > pipe.gapTop + PIPE_GAP
              ) {
                setGameOver(true);
                setGameStarted(false);
              }
            }

            // Update score when bird passes pipe
            if (!pipe.passed && pipe.x + PIPE_WIDTH < birdLeft) {
              pipe.passed = true;
              setScore((s) => s + 1);
            }
          });

          return newPipes;
        });
      }, 1000 / 60); // 60 FPS
    }

    return () => clearInterval(gameLoopRef.current);
  }, [gameStarted, gameOver, birdVelocity, birdPosition]);

  return (
    <div className="game-container" onClick={jump}>
      <div className="game-board">
        {/* Background */}
        <img src={backgroundImage} alt="background" className="background" />

        {/* Ground */}
        <img src={groundImage} alt="ground" className="ground" />

        {/* Bird */}
        <img
          src={birdImage}
          alt="bird"
          className="bird"
          style={{
            top: birdPosition,
            left: 50,
          }}
        />

        {/* Pipes */}
        {pipes.map((pipe, index) => (
          <div key={index}>
            {/* Top pipe */}
            <img
              src={topPipeImage}
              alt="top pipe"
              className="pipe pipe-top"
              style={{
                left: pipe.x,
                height: pipe.gapTop,
              }}
            />
            {/* Bottom pipe */}
            <img
              src={bottomPipeImage}
              alt="bottom pipe"
              className="pipe pipe-bottom"
              style={{
                left: pipe.x,
                top: pipe.gapTop + PIPE_GAP,
                height: GAME_HEIGHT - GROUND_HEIGHT - pipe.gapTop - PIPE_GAP,
              }}
            />
          </div>
        ))}

        {/* Score */}
        <div className="score">{score}</div>

        {/* Start/Game Over Message */}
        {!gameStarted && !gameOver && (
          <div className="message">Click or press SPACE to start</div>
        )}
        {gameOver && (
          <div className="message">
            Game Over!
            <br />
            Score: {score}
            <br />
            Click or press SPACE to restart
          </div>
        )}
      </div>
    </div>
  );
}

export default FlappyBird;
