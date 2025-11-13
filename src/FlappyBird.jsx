import { useState, useEffect, useRef } from "react";
import birdImage from "./assets/FlappyKeven.png";
import topPipeImage from "./assets/Top_Pipe.png";
import bottomPipeImage from "./assets/Bottom_Pipe.png";
import backgroundImage from "./assets/Background.jpg";
import groundImage from "./assets/Ground.png";
import gameOverImage from "./assets/Game_Over.png";
import getReadyImage from "./assets/Get_Ready.png";
import playButtonImage from "./assets/Play.jpg";
import titleImage from "./assets/Flappy_Kev_Title.png";
import coinImage from "./assets/White_Coin.png";
import bronzeCoinImage from "./assets/Bronze_Coin.png";
import silverCoinImage from "./assets/Silver_Coin.png";
import goldCoinImage from "./assets/Gold_Coin.png";
import gameStartSound from "./assets/Game_Start.mp3";
import gameOverSound from "./assets/Game_Over.mp3";
import bonusSound from "./assets/Bonus.mp3";
import pipeSound from "./assets/Pipe_Sound.mp3";
import noiceSound from "./assets/Noice.mp3";
import noiceImage from "./assets/Noice.jpg";

const BIRD_SIZE = 50;
const GAME_WIDTH = 400;
const GAME_HEIGHT = 700;
const GROUND_HEIGHT = 50;
const GRAVITY = 0.5;
const JUMP_STRENGTH = -8;
const PIPE_WIDTH = 60;
const PIPE_GAP = 180;
const PIPE_SPEED = 3;
const COIN_SIZE = 30;

const POWER_UPS = {
  INVINCIBILITY: { name: "Invincibilité", color: "#FFD700" },
  SLOW_MOTION: { name: "Ralenti", color: "#00BFFF" },
  SIZE_REDUCTION: { name: "Mini", color: "#9370DB" },
  DOUBLE_POINTS: { name: "Points x2", color: "#FF69B4" },
};

const SCORE_COINS = {
  BRONZE: { value: 1, image: bronzeCoinImage, color: "#CD7F32" },
  SILVER: { value: 2, image: silverCoinImage, color: "#C0C0C0" },
  GOLD: { value: 3, image: goldCoinImage, color: "#FFD700" },
};

function FlappyBird() {
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [birdPosition, setBirdPosition] = useState(300);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [pipes, setPipes] = useState([]);
  const [coins, setCoins] = useState([]);
  const [scoreCoins, setScoreCoins] = useState([]);
  const [activePowerUp, setActivePowerUp] = useState(null);
  const [powerUpTimeLeft, setPowerUpTimeLeft] = useState(0);
  const [showNice, setShowNice] = useState(false);
  const niceShownRef = useRef(false);

  const gameLoopRef = useRef();
  const pipeTimerRef = useRef();
  const coinTimerRef = useRef();
  const scoreCoinTimerRef = useRef();
  const powerUpTimerRef = useRef();
  const gameStartAudioRef = useRef();
  const gameOverAudioRef = useRef();
  const bonusAudioRef = useRef();
  const pipeAudioRef = useRef();
  const noiceAudioRef = useRef();

  // Initialize audio
  useEffect(() => {
    gameStartAudioRef.current = new Audio(gameStartSound);
    gameOverAudioRef.current = new Audio(gameOverSound);
    bonusAudioRef.current = new Audio(bonusSound);
    pipeAudioRef.current = new Audio(pipeSound);
    pipeAudioRef.current.volume = 0.1; // Lower volume for pipe sound
    noiceAudioRef.current = new Audio(noiceSound);
  }, []);

  // Load best score from localStorage on mount
  useEffect(() => {
    const savedBestScore = localStorage.getItem("flappyBirdBestScore");
    if (savedBestScore) {
      setBestScore(parseInt(savedBestScore, 10));
    }
  }, []);

  // Update best score when game ends
  useEffect(() => {
    if (gameOver && score > bestScore) {
      setBestScore(score);
      localStorage.setItem("flappyBirdBestScore", score.toString());
    }
  }, [gameOver, score, bestScore]);

  // Handle play button click
  const handlePlayClick = (e) => {
    e.stopPropagation();
    // Play game start sound immediately
    if (gameStartAudioRef.current) {
      gameStartAudioRef.current.currentTime = 0.5;
      gameStartAudioRef.current.play().catch((error) => {
        console.log("Audio play failed:", error);
      });
    }
    setShowStartScreen(false);
    setGameStarted(true);
  };

  // Handle jump
  const jump = () => {
    if (showStartScreen) {
      // Play game start sound immediately
      if (gameStartAudioRef.current) {
        gameStartAudioRef.current.currentTime = 0.5;
        gameStartAudioRef.current.play().catch((error) => {
          console.log("Audio play failed:", error);
        });
      }
      // Start the game when on start screen
      setShowStartScreen(false);
      setGameStarted(true);
      return;
    }
    if (!gameStarted) {
      setGameStarted(true);
      return;
    }
    if (gameOver) {
      // Restart game
      setBirdPosition(300);
      setBirdVelocity(0);
      setGameOver(false);
      setScore(0);
      setPipes([]);
      setCoins([]);
      setScoreCoins([]);
      setActivePowerUp(null);
      setPowerUpTimeLeft(0);
      setShowNice(false);
      niceShownRef.current = false;
      setShowStartScreen(true);
      setGameStarted(false);
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
  }, [gameStarted, gameOver, showStartScreen]);

  // Generate pipes
  useEffect(() => {
    if (gameStarted && !gameOver) {
      // Adjust pipe spawn interval based on slow motion
      const spawnInterval = activePowerUp === "SLOW_MOTION" ? 3000 : 2000;

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
      }, spawnInterval);
    }
    return () => clearInterval(pipeTimerRef.current);
  }, [gameStarted, gameOver, activePowerUp]);

  // Generate coins (power-ups)
  useEffect(() => {
    if (gameStarted && !gameOver && !activePowerUp) {
      const spawnCoin = () => {
        // Random interval between 8-15 seconds
        const nextSpawnTime = Math.random() * 7000 + 8000;
        coinTimerRef.current = setTimeout(() => {
          const coinY =
            Math.random() * (GAME_HEIGHT - GROUND_HEIGHT - 100) + 50;
          setCoins([{ x: GAME_WIDTH, y: coinY }]);
          spawnCoin();
        }, nextSpawnTime);
      };
      spawnCoin();
    }
    return () => clearTimeout(coinTimerRef.current);
  }, [gameStarted, gameOver, activePowerUp]);

  // Generate score coins (Bronze, Silver, Gold)
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const spawnScoreCoin = () => {
        // Random interval between 3-6 seconds
        const nextSpawnTime = Math.random() * 3000 + 3000;
        scoreCoinTimerRef.current = setTimeout(() => {
          const coinY =
            Math.random() * (GAME_HEIGHT - GROUND_HEIGHT - 100) + 50;

          // Random coin type with weighted probability
          const rand = Math.random();
          let coinType;
          if (rand < 0.6) {
            coinType = "BRONZE"; // 60% chance
          } else if (rand < 0.9) {
            coinType = "SILVER"; // 30% chance
          } else {
            coinType = "GOLD"; // 10% chance
          }

          setScoreCoins((prev) => [
            ...prev,
            { x: GAME_WIDTH, y: coinY, type: coinType },
          ]);
          spawnScoreCoin();
        }, nextSpawnTime);
      };
      spawnScoreCoin();
    }
    return () => clearTimeout(scoreCoinTimerRef.current);
  }, [gameStarted, gameOver]);

  // Power-up timer countdown
  useEffect(() => {
    if (activePowerUp && powerUpTimeLeft > 0) {
      powerUpTimerRef.current = setInterval(() => {
        setPowerUpTimeLeft((prev) => {
          if (prev <= 0.1) {
            setActivePowerUp(null);
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
    }
    return () => clearInterval(powerUpTimerRef.current);
  }, [activePowerUp, powerUpTimeLeft]);

  // Check for score of 69
  useEffect(() => {
    if (score === 69 && !niceShownRef.current) {
      setShowNice(true);
      niceShownRef.current = true;
      // Play noice sound
      if (noiceAudioRef.current) {
        noiceAudioRef.current.currentTime = 0;
        noiceAudioRef.current.play().catch((error) => {
          console.log("Audio play failed:", error);
        });
      }
      setTimeout(() => {
        setShowNice(false);
      }, 1000);
    }
  }, [score]);

  // Game loop
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const currentSpeed =
        activePowerUp === "SLOW_MOTION" ? PIPE_SPEED * 0.5 : PIPE_SPEED;
      const currentBirdSize =
        activePowerUp === "SIZE_REDUCTION" ? BIRD_SIZE * 0.6 : BIRD_SIZE;

      gameLoopRef.current = setInterval(() => {
        // Update bird position
        setBirdVelocity((v) => v + GRAVITY);
        setBirdPosition((pos) => {
          const newPos = pos + birdVelocity;

          // Check floor/ceiling collision with tighter hitbox
          const collisionMargin = 8;
          if (
            newPos < -collisionMargin ||
            newPos >
              GAME_HEIGHT - GROUND_HEIGHT - currentBirdSize + collisionMargin
          ) {
            setGameOver(true);
            setGameStarted(false);
            // Play game over sound
            if (gameOverAudioRef.current) {
              gameOverAudioRef.current.play().catch((error) => {
                console.log("Audio play failed:", error);
              });
            }
            return pos;
          }

          return newPos;
        });

        // Update coins
        setCoins((prevCoins) => {
          const newCoins = prevCoins
            .map((coin) => ({ ...coin, x: coin.x - currentSpeed }))
            .filter((coin) => coin.x > -COIN_SIZE);

          // Check collision with coins
          const birdLeft = 50;
          const birdRight = 50 + currentBirdSize;
          const birdTop = birdPosition;
          const birdBottom = birdPosition + currentBirdSize;

          return newCoins.filter((coin) => {
            const coinLeft = coin.x;
            const coinRight = coin.x + COIN_SIZE;
            const coinTop = coin.y;
            const coinBottom = coin.y + COIN_SIZE;

            // Check if bird collides with coin
            if (
              birdRight > coinLeft &&
              birdLeft < coinRight &&
              birdBottom > coinTop &&
              birdTop < coinBottom
            ) {
              // Activate random power-up
              const powerUpTypes = Object.keys(POWER_UPS);
              const randomPowerUp =
                powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
              const duration = Math.random() * 7 + 3; // 3-10 seconds

              setActivePowerUp(randomPowerUp);
              setPowerUpTimeLeft(duration);

              // Play bonus sound
              if (bonusAudioRef.current) {
                bonusAudioRef.current.play().catch((error) => {
                  console.log("Audio play failed:", error);
                });
              }

              return false; // Remove coin
            }
            return true; // Keep coin
          });
        });

        // Update score coins
        setScoreCoins((prevScoreCoins) => {
          const newScoreCoins = prevScoreCoins
            .map((coin) => ({ ...coin, x: coin.x - currentSpeed }))
            .filter((coin) => coin.x > -COIN_SIZE);

          // Check collision with score coins
          const birdLeft = 50;
          const birdRight = 50 + currentBirdSize;
          const birdTop = birdPosition;
          const birdBottom = birdPosition + currentBirdSize;

          return newScoreCoins.filter((coin) => {
            const coinLeft = coin.x;
            const coinRight = coin.x + COIN_SIZE;
            const coinTop = coin.y;
            const coinBottom = coin.y + COIN_SIZE;

            // Check if bird collides with coin
            if (
              birdRight > coinLeft &&
              birdLeft < coinRight &&
              birdBottom > coinTop &&
              birdTop < coinBottom
            ) {
              // Add score based on coin type
              const coinValue = SCORE_COINS[coin.type].value;
              const pointsToAdd =
                activePowerUp === "DOUBLE_POINTS" ? coinValue * 2 : coinValue;
              setScore((s) => s + pointsToAdd);

              // Play bonus sound
              if (bonusAudioRef.current) {
                bonusAudioRef.current.play().catch((error) => {
                  console.log("Audio play failed:", error);
                });
              }

              return false; // Remove coin
            }
            return true; // Keep coin
          });
        });

        // Update pipes
        setPipes((prevPipes) => {
          const newPipes = prevPipes
            .map((pipe) => ({ ...pipe, x: pipe.x - currentSpeed }))
            .filter((pipe) => pipe.x > -PIPE_WIDTH);

          // Check collision with pipes
          newPipes.forEach((pipe) => {
            // Add collision margin to make hitbox tighter (more forgiving)
            const collisionMargin = 8;
            const birdLeft = 50 + collisionMargin;
            const birdRight = 50 + currentBirdSize - collisionMargin;
            const birdTop = birdPosition + collisionMargin;
            const birdBottom = birdPosition + currentBirdSize - collisionMargin;

            const pipeLeft = pipe.x;
            const pipeRight = pipe.x + PIPE_WIDTH;

            // Check if bird is in pipe's x range
            if (birdRight > pipeLeft && birdLeft < pipeRight) {
              // Check if bird hits top or bottom pipe
              if (
                birdTop < pipe.gapTop ||
                birdBottom > pipe.gapTop + PIPE_GAP
              ) {
                // Handle collision based on power-ups
                if (activePowerUp === "INVINCIBILITY") {
                  // Do nothing, invincible
                } else {
                  setGameOver(true);
                  setGameStarted(false);
                  // Play game over sound
                  if (gameOverAudioRef.current) {
                    gameOverAudioRef.current.play().catch((error) => {
                      console.log("Audio play failed:", error);
                    });
                  }
                }
              }
            }

            // Update score when bird passes pipe
            if (!pipe.passed && pipe.x + PIPE_WIDTH < birdLeft) {
              pipe.passed = true;
              const points = activePowerUp === "DOUBLE_POINTS" ? 2 : 1;
              setScore((s) => s + points);

              // Play pipe sound
              if (pipeAudioRef.current) {
                pipeAudioRef.current.currentTime = 0;
                pipeAudioRef.current.play().catch((error) => {
                  console.log("Audio play failed:", error);
                });
              }
            }
          });

          return newPipes;
        });
      }, 1000 / 60); // 60 FPS
    }

    return () => clearInterval(gameLoopRef.current);
  }, [gameStarted, gameOver, birdVelocity, birdPosition, activePowerUp]);

  return (
    <div className="game-container" onClick={jump}>
      <div className="game-board">
        {/* Background */}
        <img src={backgroundImage} alt="background" className="background" />

        {/* Ground */}
        <img src={groundImage} alt="ground" className="ground" />

        {/* Bird */}
        {gameStarted && !gameOver && (
          <img
            src={birdImage}
            alt="bird"
            className="bird"
            style={{
              top: birdPosition,
              left: 50,
              width:
                activePowerUp === "SIZE_REDUCTION"
                  ? BIRD_SIZE * 0.6
                  : BIRD_SIZE,
              height:
                activePowerUp === "SIZE_REDUCTION"
                  ? BIRD_SIZE * 0.6
                  : BIRD_SIZE,
            }}
          />
        )}

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

        {/* Coins (Power-ups) */}
        {coins.map((coin, index) => (
          <img
            key={index}
            src={coinImage}
            alt="power-up coin"
            className="coin white-coin"
            style={{
              left: coin.x,
              top: coin.y,
            }}
          />
        ))}

        {/* Score Coins */}
        {scoreCoins.map((coin, index) => (
          <img
            key={index}
            src={SCORE_COINS[coin.type].image}
            alt={`${coin.type.toLowerCase()} coin`}
            className="coin"
            style={{
              left: coin.x,
              top: coin.y,
            }}
          />
        ))}

        {/* Score */}
        {!showStartScreen && <div className="score">{score}</div>}

        {/* NOICE! Message */}
        {showNice && (
          <img src={noiceImage} alt="NOICE" className="nice-message" />
        )}

        {/* Power-up Info */}
        {activePowerUp && (
          <div
            className="power-up-info"
            style={{ borderColor: POWER_UPS[activePowerUp].color }}
          >
            <div
              className="power-up-name"
              style={{ color: POWER_UPS[activePowerUp].color }}
            >
              {POWER_UPS[activePowerUp].name}
            </div>
            <div className="power-up-timer">{powerUpTimeLeft.toFixed(1)}s</div>
          </div>
        )}

        {/* Start Screen */}
        {showStartScreen && (
          <div className="start-screen">
            <img src={titleImage} alt="Flappy Kev" className="title-image" />
            <img
              src={getReadyImage}
              alt="Get Ready"
              className="get-ready-image"
            />
            <div className="instructions">
              <p>Cliquez ou appuyez sur ESPACE pour faire voler Keven</p>
              <p>Évitez les pipes !</p>
              {bestScore > 0 && (
                <p className="best-score-text">Meilleur score: {bestScore}</p>
              )}
            </div>
            <div className="power-ups-info">
              <div className="power-ups-title">
                <img src={coinImage} alt="coin" className="coin-icon" />
                Power-Ups
              </div>
              <div className="power-ups-list">
                <div className="power-up-item">
                  <span style={{ color: POWER_UPS.INVINCIBILITY.color }}>
                    {POWER_UPS.INVINCIBILITY.name}
                  </span>
                  : Keven devient invincible!
                </div>
                <div className="power-up-item">
                  <span style={{ color: POWER_UPS.SLOW_MOTION.color }}>
                    {POWER_UPS.SLOW_MOTION.name}
                  </span>
                  : Keven vole au ralenti!
                </div>
                <div className="power-up-item">
                  <span style={{ color: POWER_UPS.SIZE_REDUCTION.color }}>
                    {POWER_UPS.SIZE_REDUCTION.name}
                  </span>
                  : Keven rétrécit!
                </div>
                <div className="power-up-item">
                  <span style={{ color: POWER_UPS.DOUBLE_POINTS.color }}>
                    {POWER_UPS.DOUBLE_POINTS.name}
                  </span>
                  : Keven double les points!
                </div>
              </div>
              <div className="coins-section">
                <div className="coins-title">Pièces</div>
                <div className="coins-list">
                  <div className="coin-item">
                    <img
                      src={bronzeCoinImage}
                      alt="bronze"
                      className="coin-mini"
                    />
                    <span style={{ color: SCORE_COINS.BRONZE.color }}>+1</span>
                  </div>
                  <div className="coin-item">
                    <img
                      src={silverCoinImage}
                      alt="silver"
                      className="coin-mini"
                    />
                    <span style={{ color: SCORE_COINS.SILVER.color }}>+2</span>
                  </div>
                  <div className="coin-item">
                    <img src={goldCoinImage} alt="gold" className="coin-mini" />
                    <span style={{ color: SCORE_COINS.GOLD.color }}>+3</span>
                  </div>
                </div>
              </div>
            </div>
            <img
              src={playButtonImage}
              alt="Play"
              className="play-button"
              onClick={handlePlayClick}
            />
          </div>
        )}

        {/* Game Over Message */}
        {gameOver && (
          <div className="game-over-screen">
            <img
              src={gameOverImage}
              alt="Game Over"
              className="game-over-image"
            />
            <div className="game-over-score">Score: {score}</div>
            <div className="game-over-best-score">
              Meilleur score: {bestScore}
            </div>
            <div className="game-over-restart">
              Cliquez ou appuyez sur ESPACE pour recommencer
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FlappyBird;
