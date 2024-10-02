// Constants
const BOARD_SIZE = 5;
const BASE_RTP = 0.97;
const MAX_BOMBS = 24;
const HINT_BASE_COST_FACTOR = 0.5;
const RTP_ADJUSTMENT_FACTOR = 0.2;
// const XLSX = require('xlsx');

// Game state
let board = [];
let bombPositions = [];
let revealedCells = 0;
let points = 0;
let balance = 1000;
let startPoints = 1;
let gameOver = false;
let bombs = 0;
let hintsBought = 0;
let hintMode = false;
let testMode = false;
let isSimulationMode = false;
let simulationBalance = 0;
let simulationStartingBalance = 0;


function showMessage(message) {
    if (isSimulationMode) return; // Skip showing messages during simulation

    const messagePopup = document.getElementById('message-popup');
    const messageText = document.getElementById('message-text');

    messageText.textContent = message;
    messagePopup.classList.remove('hidden');

    setTimeout(() => {
        messagePopup.classList.add('hidden');
    }, 2000);
}

function startGame() {
    document.getElementById('start-points').disabled = true;
    document.getElementById('bombs').disabled = true;
    bombs = parseInt(document.getElementById('bombs').value);
    startPoints = parseInt(document.getElementById('start-points').value);
    revealedCells = 0;

    if (bombs > 24) {
        showMessage("The maximum number of bombs allowed is 24.");
        return;
    }
    if (startPoints === 0) {
        showMessage("You must start with at least 1 credit.");
        return;
    }
    if (startPoints > balance) {
        showMessage("You don't have enough credits to start with this amount.");
        return;
    }

    points = 0; // Start with 0 points
    balance -= parseFloat(startPoints.toFixed(2)); // Deduct start points from balance
    gameOver = false;
    revealedCells = 0;
    bombPositions = [];
    board = Array(5).fill().map(() => Array(5).fill(0));
    document.getElementById('points').textContent = `Win: €${points}`;
    document.getElementById('balance').textContent = `Balance: €${balance} `;
    document.getElementById('status').textContent = "Game in Progress...";

    generateBombs(bombs);
    drawBoard();

    document.querySelector('button[onclick="startGame()"]').style.display = 'none';
    document.getElementById('hint-btn').style.display = 'inline-block';
    document.getElementById('stop-btn').style.display = 'inline-block';
    document.getElementById('potential-points').style.display = 'block';

    const potentialPoints = calculatePoints(1, BOARD_SIZE * BOARD_SIZE, bombs);
    document.getElementById('potential-points').textContent = `Potential Win: ${potentialPoints.toFixed(2)}X`;

   hintsBought = 0;
   updateHintButton();

    //Test mode 
    if (testMode) {
        // Add the "B" letter to bomb cells
        for (const [x, y] of bombPositions) {
            const cell = document.querySelector(`[data-row="${x}"][data-col="${y}"]`);
            cell.textContent = "B";
        }
    }
}

function calculatePoints(revealedCells, boardSize, totalBombs) {
    const probability = combination(boardSize - totalBombs, revealedCells) / combination(boardSize, revealedCells);
    return getAdjustedRTP() / probability;
}

function getAdjustedRTP() {
    const riskMeterValue = hintsBought / (BOARD_SIZE * BOARD_SIZE - bombs);
    return BASE_RTP + (riskMeterValue * RTP_ADJUSTMENT_FACTOR);
}

function combination(n, k) {
    let result = 1;
    for (let i = 1; i <= k; i++) {
        result *= (n - i + 1) / i;
    }
    return result;
}


function generateBombs(bombs) {
    while (bombPositions.length < bombs) {
        const x = Math.floor(Math.random() * 5);
        const y = Math.floor(Math.random() * 5);
        if (!board[x][y]) {
            board[x][y] = -1;
            bombPositions.push([x, y]);
        }
    }
}

function drawBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';

    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell hidden';
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.onclick = () => revealCell(i, j);

            // Append the hidden icon image
            //cell.appendChild(hiddenIcon.cloneNode(true));

            gameBoard.appendChild(cell);
        }
    }
}

function revealCell(row, col) {
    if (gameOver || board[row][col] === 1) return;

    if (!isSimulationMode) {
        const cell = document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
        if (board[row][col] === -1) {
            cell.classList.add('bomb');
            gameOver = true;
            endGame(false);
        } else {
            cell.classList.remove('hidden');
            cell.classList.add('safe');
        }
    } else {
        if (board[row][col] === -1) {
            gameOver = true;
            endGame(false);
        }
    }

    if (board[row][col] !== -1) {
        board[row][col] = 1;
        revealedCells++;

        if (!isSimulationMode) {
            const potentialPoints = calculatePoints(revealedCells + 1, BOARD_SIZE * BOARD_SIZE, bombs);
            document.getElementById('potential-points').textContent = `Next Multiplier: ${potentialPoints.toFixed(2)}X`;
        }

        const pointsToAward = calculatePoints(revealedCells, BOARD_SIZE * BOARD_SIZE, bombs);
        points = parseFloat((pointsToAward * startPoints).toFixed(2));
        
        if (!isSimulationMode) {
            document.getElementById('points').textContent = `Win: €${points}`;
            updateHintButton();
        }
        
        checkWin();
    }
}

function checkWin() {
    if (revealedCells === BOARD_SIZE * BOARD_SIZE - bombPositions.length) {
        endGame(true);
    }
}

function endGame(won) {
    if (!isSimulationMode) {
        if (won) {
            balance += parseFloat(points.toFixed(2));
            document.getElementById('balance').textContent = `Balance: €${balance}`;
        }
        gameOver = true;
        document.getElementById('status').textContent = won ? "You Win!" : "You Lose!";
        document.getElementById('hint-btn').style.display = 'none';
        document.getElementById('stop-btn').style.display = 'none';
        document.getElementById('reset-btn').style.display = 'inline-block';
        document.getElementById('potential-points').style.display = 'none';
        revealBombs();
    } else {
        gameOver = true;
    }
}

function revealBombs() {
    bombPositions.forEach(pos => {
        const [row, col] = pos;
        const cell = document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
        cell.classList.add('bomb');
    });
}

function updateHintButton() {
    const hintButton = document.getElementById('hint-btn');
    
    if (revealedCells > 0) {
        const possibleHints = getPossibleHintCells();
        if (possibleHints.length > 0) {
            let totalCost = 0;
            let validHints = 0;

            for (const cell of possibleHints) {
                const cost = calculateHintCost(cell);
                if (!isNaN(cost) && isFinite(cost)) {
                    totalCost += cost;
                    validHints++;
                }
            }

            if (validHints > 0) {
                const averageHintCost = totalCost / validHints;
                hintButton.textContent = `Buy Hint (€ ${averageHintCost.toFixed(2)} )`;
                hintButton.disabled = points < averageHintCost;
            } else {
                hintButton.textContent = "Hint unavailable";
                hintButton.disabled = true;
            }
        } else {
            hintButton.textContent = "No hints available";
            hintButton.disabled = true;
        }
    } else {
        hintButton.textContent = "Buy Hint";
        hintButton.disabled = true;
    }
}

function calculateHintCost(hintCell) {
    const currentPotentialWin = calculatePoints(revealedCells + 1, BOARD_SIZE * BOARD_SIZE, bombs) * startPoints;
    const baseCost = currentPotentialWin * HINT_BASE_COST_FACTOR;
    const informationGainFactor = calculateInformationGainFactor(hintCell);
    
    // Final cost, considering information gain
    const cost = baseCost * (1 - informationGainFactor);
    
    // Ensure cost is not negative or NaN
    return isNaN(cost) || cost < 0 ? baseCost : cost;
}

// Calculate the information gain factor from entropy before and after the hint
function calculateInformationGainFactor(hintCell) {
    const entropyBefore = calculateEntropy(hintCell);
    const expectedEntropyAfter = calculateExpectedEntropyAfter(hintCell);

    // Avoid division by zero
    if (entropyBefore === 0) return 0;

    // Calculate the information gain factor, between 0 and 1
    return (entropyBefore - expectedEntropyAfter) / entropyBefore;
}

// Calculate the entropy based on probability
function calculateEntropy(hintCell) {
    const unrevealedNeighbors = getNeighborCells(hintCell.row, hintCell.col)
        .filter(neighbor => board[neighbor.row][neighbor.col] !== 1).length;
    const maxBombCount = unrevealedNeighbors < bombs ? unrevealedNeighbors : bombs;

    // Probability of encountering a bomb
    const p = maxBombCount / unrevealedNeighbors;
    return retFunction(p);
}

// Helper function for calculating entropy
function retFunction(p) {
    if (p === 0 || p === 1) {
        return 0; // Define edge cases
    }
    return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
}

// Calculate the expected entropy after revealing a hint
function calculateExpectedEntropyAfter(hintCell) {
    const totalNeighbors = getNeighborCells(hintCell.row, hintCell.col).length;
    let expectedEntropy = 0;
    
    for (let i = 0; i <= hintCell.maxBombCount; i++) {
        const p = combination(hintCell.maxBombCount, i) * combination(totalNeighbors - hintCell.maxBombCount, totalNeighbors - i) / combination(totalNeighbors, totalNeighbors);
        expectedEntropy += p * calculateEntropy({ row: hintCell.row, col: hintCell.col, maxBombCount: i });
    }

    return expectedEntropy;
}

function getNeighborCells(row, col) {
    const neighbors = [];
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const newRow = row + i;
            const newCol = col + j;
            if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE && (i !== 0 || j !== 0)) {
                neighbors.push({ row: newRow, col: newCol });
            }
        }
    }
    return neighbors;
}

function buyHint() {
    if (isSimulationMode) {
        return simulateBuyHint();
    }

    if (hintMode) {
        hintMode = false;
        resetHintPreviews();
        updateHintButton();
        return 0; // No cost if cancelling hint mode
    }

    const possibleCells = getPossibleHintCells();

    if (possibleCells.length === 0) {
        showMessage("No valid cells left to hint!");
        return 0; // No cost if no valid cells to hint
    }

    hintMode = true;
    previewHintCosts(possibleCells);
    return 0; // In normal gameplay, cost is applied when a specific hint is chosen
}


function previewHintCosts(possibleCells) {
    possibleCells.forEach(hintCell => {
        const cellElement = document.querySelector(`.cell[data-row='${hintCell.row}'][data-col='${hintCell.col}']`);
        const hintCost = calculateHintCost(hintCell);
        cellElement.textContent = `${hintCost.toFixed(2)}`;
        cellElement.classList.add('hint-preview');
        cellElement.onclick = () => confirmHintPurchase(hintCell, hintCost);
    });
}

function confirmHintPurchase(hintCell, hintCost) {
    if (points < hintCost) {
        showMessage("Not enough credits to buy the hint!");
        return;
    }

    points -= hintCost;
    document.getElementById('points').textContent = `€ ${points.toFixed(2)}`;
    
    resetHintPreviews();
    const cellElement = document.querySelector(`.cell[data-row='${hintCell.row}'][data-col='${hintCell.col}']`);
    cellElement.classList.add('hinted');
    cellElement.textContent = hintCell.maxBombCount;
    cellElement.onclick = null;

    hintsBought++;
    hintMode = false;
    updateHintButton();
}

function resetHintPreviews() {
    const hintPreviewCells = document.querySelectorAll('.hint-preview');
    hintPreviewCells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('hint-preview');
        cell.onclick = null;
    });
}

function getPossibleHintCells() {
    const possibleCells = [];

    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            // Check if the current cell is revealed (i.e., board[i][j] === 1)
            if (board[i][j] === 1) {
                let maxBombCount = 0;
                let hasUnrevealedNeighbor = false;

                // Loop through neighbors to check for unrevealed cells
                for (let x = -1; x <= 1; x++) {
                    for (let y = -1; y <= 1; y++) {
                        const neighborRow = i + x;
                        const neighborCol = j + y;

                        // Ensure the neighboring cell is within bounds
                        if (neighborRow >= 0 && neighborRow < BOARD_SIZE && neighborCol >= 0 && neighborCol < BOARD_SIZE) {
                            // Check if the neighboring cell is unrevealed
                            if (board[neighborRow][neighborCol] === 0) {
                                hasUnrevealedNeighbor = true;
                            }

                            // Count the number of bombs around this cell
                            if (board[neighborRow][neighborCol] === -1) {
                                maxBombCount++;
                                hasUnrevealedNeighbor = true;
                            }
                        }
                    }
                }

                // If the current cell has at least one unrevealed neighbor, it can be hinted
                if (hasUnrevealedNeighbor) {
                    possibleCells.push({ row: i, col: j, maxBombCount });
                }
            }
        }
    }

    return possibleCells;
}



function revealHint(possibleCells) {
    if (possibleCells.length > 0) {
        const hintCell = possibleCells[Math.floor(Math.random() * possibleCells.length)];
        const cellElement = document.querySelector(`.cell[data-row='${hintCell.row}'][data-col='${hintCell.col}']`);
        cellElement.textContent = hintCell.bombCount;
        cellElement.classList.add('hinted');
    } else {
        showMessage("No valid cells left to hint!");
    }
}

function stopGame() {
    if (revealedCells === 0) {
        showMessage("You must reveal at least one cell before stopping the game.");
        return;
    }
    if (hintMode){
        showMessage("You must select a hinted cell before proceeding.");
        return;
    }
    endGame(true);
}

function resetGame() {
    document.getElementById('reset-btn').style.display = 'none';
    document.getElementById('status').textContent = "Choose your starting credits and bombs:";
    document.getElementById('hint-btn').style.display = 'none';
    document.getElementById('stop-btn').style.display = 'none';
    document.getElementById('game-board').innerHTML = '';
    points = 0;
    document.getElementById('points').textContent = ``;
    // Show the start game button again
    document.querySelector('button[onclick="startGame()"]').style.display = 'inline-block';
    document.getElementById('potential-points').style.display = 'none';
    document.getElementById('start-points').disabled = false;
    document.getElementById('bombs').disabled = false;
}

/* Simulation functions */

function simulateGames(iterations = 10) {
  isSimulationMode = true; // Enter simulation mode
  simulationResults = []; // Clear previous results
  simulationBalance = 100000; // Start with an initial balance
  simulationStartingBalance = simulationBalance;
  
  for (let i = 0; i < iterations; i++) {
    startPoints = parseInt(document.getElementById('start-points').value);
    const bombCount = parseInt(document.getElementById('bombs').value);
    //console.log("Start points: ", startPoints);
    if (simulationBalance < startPoints) {
      break; // Stop simulation if we run out of money
    }

    let gameResult = {
      gameNumber: i + 1,
      startingBalance: simulationBalance,
      startPoints: startPoints,
      bombCount: bombCount,
      moneyWon: 0,
      moneySpentOnHints: 0,
      hintsBought: 0,
      cellsRevealed: 0,
      outcome: 'Lost',
      finalBalance: 0
    };

    simulateStartGame(startPoints, bombCount);
    
    // Create a separate board for the simulation that doesn't know bomb locations
    let simulationBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill('unknown'));

    // Reveal at least one cell randomly at the start
    let gameContinues = true;
    while (gameContinues && gameResult.cellsRevealed === 0) {
      const initialCell = chooseCellToReveal(simulationBoard);
      gameContinues = simulateRevealCell(initialCell.row, initialCell.col, simulationBoard, gameResult);
    }

    while (gameContinues && !gameOver) {
      const decision = makeDecision(simulationBoard, gameResult);
      
      switch(decision) {
        case 'reveal':
          const cellToReveal = chooseCellToReveal(simulationBoard);
          gameContinues = simulateRevealCell(cellToReveal.row, cellToReveal.col, simulationBoard, gameResult);
          break;
        case 'hint':
          const hintCost = simulateBuyHint(gameResult);
          if (hintCost > 0 && points > hintCost) {
            gameResult.moneySpentOnHints += hintCost;
            gameResult.hintsBought++;
            points -= hintCost;
            applyHintToSimulationBoard(simulationBoard);
          } else {
            gameContinues = false;
          }
          break;
        case 'cashout':
          gameContinues = false;
          break;
      }
    }
    
    gameResult.moneyWon = points;
    gameResult.outcome = points > 0 ? 'Won' : 'Lost';
    
    // Update simulation balance
    simulationBalance -= startPoints; // Deduct the bet
    if (gameResult.outcome === 'Won') {
      simulationBalance += gameResult.moneyWon; // Add winnings
    }
    simulationBalance -= gameResult.moneySpentOnHints; // Deduct money spent on hints
    
    gameResult.finalBalance = simulationBalance;
    simulationResults.push(gameResult);
  }

  isSimulationMode = false; // Exit simulation mode
  console.log("Simulation completed");
  displaySimulationSummary(simulationStartingBalance);
}


function simulateRevealCell(row, col, simulationBoard, gameResult) {
  if (board[row][col] === -1) {
    // Hit a bomb
    simulationBoard[row][col] = 'bomb';
    gameResult.cellsRevealed++;
    return false; // Game ends
  } else {
    simulationBoard[row][col] = 'safe';
    gameResult.cellsRevealed++;
    revealCell(row, col); // This updates the actual game state
    return true; // Game continues
  }
}

function makeDecision(simulationBoard, gameResult) {
  const riskLevel = calculateRiskLevel(simulationBoard, gameResult);
  const potentialReward = calculatePotentialReward();
  const hintCost = estimateHintCost();
  console.log("Risk Level: ",riskLevel)
  if (riskLevel > 0.9) {
    console.log("Cashout");
    return 'cashout';
  } else if (riskLevel > 0.7 && hintCost < potentialReward * 0.5) {
    console.log("hint");
    return 'hint';
  } else {
    console.log("reveal");
    return 'reveal';
  }
}


function simulateStartGame(startPoints, bombCount) {
  bombs = bombCount;
  points = 0;
  gameOver = false;
  revealedCells = 0;
  bombPositions = [];
  board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
  generateBombs(bombs);
}

function simulateBuyHint() {
    const possibleCells = getPossibleHintCells();
    if (possibleCells.length === 0) {
        return 0;
    }
    //console.log("Start points: ", startPoints);
    const randomHintCell = possibleCells[Math.floor(Math.random() * possibleCells.length)];
    return calculateHintCost(randomHintCell);
}

function calculateHintCost(hintCell) {
    const currentPotentialWin = calculatePoints(revealedCells + 1, BOARD_SIZE * BOARD_SIZE, bombs) * startPoints;
    const baseCost = currentPotentialWin * HINT_BASE_COST_FACTOR;
    const informationGainFactor = calculateInformationGainFactor(hintCell);
    
    // Final cost, considering information gain
    const cost = baseCost * (1 - informationGainFactor);
    
    // Ensure cost is not negative or NaN
    return isNaN(cost) || cost < 0 ? baseCost : cost;
}
function applyHintToSimulationBoard(simulationBoard) {
    // Simulate getting a hint by marking a random 'unknown' cell as 'hinted'
    const unknownCells = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (simulationBoard[row][col] === 'unknown') {
                unknownCells.push({row, col});
            }
        }
    }
    if (unknownCells.length > 0) {
        const hintedCell = unknownCells[Math.floor(Math.random() * unknownCells.length)];
        simulationBoard[hintedCell.row][hintedCell.col] = 'hinted';
    }
}

function displaySimulationSummary(simulationStartingBalance) {
  const totalGames = simulationResults.length;
  const gamesWon = simulationResults.filter(game => game.outcome === 'Won').length;
  const totalMoneyWon = simulationResults.reduce((sum, game) => sum + (game.outcome === 'Won' ? game.moneyWon : 0), 0);
  const totalMoneyLost = totalGames * startPoints;
  const totalMoneySpentOnHints = simulationResults.reduce((sum, game) => sum + game.moneySpentOnHints, 0);
  const averageCellsRevealed = simulationResults.reduce((sum, game) => sum + game.cellsRevealed, 0) / totalGames;
  const finalBalance = simulationResults[simulationResults.length - 1].finalBalance;
  const returnToPlayer = (totalMoneyWon/(totalMoneyLost+totalMoneySpentOnHints))*100; 
  const casinoEdge =  finalBalance - simulationStartingBalance;

  const summaryHTML = `
    <h2>Simulation Summary</h2>
    <p>Total Games: ${totalGames}</p>
    <p>Games Won: ${gamesWon} (${((gamesWon / totalGames) * 100).toFixed(2)}%)</p>
    <p>Total Money Won: €${totalMoneyWon.toFixed(2)}</p>
    <p>Total Money Gambled: €${totalMoneyLost.toFixed(2)}</p>
    <p>Total Money Spent on Hints: €${totalMoneySpentOnHints.toFixed(2)}</p>
    <p>Average Cells Revealed: ${averageCellsRevealed.toFixed(2)}</p>
    <p>Final Balance: €${finalBalance.toFixed(2)}</p>
    <p>RTP: ${returnToPlayer.toFixed(2)}%</p>
    <p>PLayer WIN/LOSS: € ${casinoEdge.toFixed(2)}</p>
    <button onclick="downloadSimulationResults()">Download Results (CSV)</button>`;

  const summaryElement = document.getElementById('simulation-summary');
  if (summaryElement) {
    summaryElement.innerHTML = summaryHTML;
  } else {
    const newSummaryElement = document.createElement('div');
    newSummaryElement.id = 'simulation-summary';
    newSummaryElement.innerHTML = summaryHTML;
    document.body.appendChild(newSummaryElement);
  }
}

function calculateRiskLevel(simulationBoard, gameResult) {
  const unknownCells = simulationBoard.flat().filter(cell => cell === 'unknown').length;
  const estimatedRemainingBombs = bombs - gameResult.hintsBought;
  return estimatedRemainingBombs / unknownCells;
}


function calculatePotentialReward() {
  //console.log("Revealed Cells: ",revealedCells,"Bombs: ",bombs,"Starts points: ",startPoints);
  return calculatePoints(revealedCells + 1, BOARD_SIZE * BOARD_SIZE, bombs) * startPoints;
}

function estimateHintCost() {
  // This is a simplified estimation. You might want to use the actual hint cost calculation here.
  return calculatePotentialReward() * HINT_BASE_COST_FACTOR;
}

function chooseCellToReveal(simulationBoard) {
  const unknownCells = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (simulationBoard[row][col] === 'unknown') {
        unknownCells.push({row, col});
      }
    }
  }
  return unknownCells[Math.floor(Math.random() * unknownCells.length)];
}

function applyHintToSimulationBoard(simulationBoard) {
  // Simulate getting a hint by marking a random 'unknown' cell as 'hinted'
  const unknownCells = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (simulationBoard[row][col] === 'unknown') {
        unknownCells.push({row, col});
      }
    }
  }
  if (unknownCells.length > 0) {
    const hintedCell = unknownCells[Math.floor(Math.random() * unknownCells.length)];
    simulationBoard[hintedCell.row][hintedCell.col] = 'hinted';
  }
}
function downloadSimulationResults() {
  const csvContent = convertToCSV(simulationResults);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "simulation_results.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function convertToCSV(objArray) {
  const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
  let str = `${Object.keys(array[0]).join(",")}\r\n`;

  for (let i = 0; i < array.length; i++) {
    let line = '';
    for (let index in array[i]) {
      if (line !== '') line += ',';
      line += array[i][index];
    }
    str += line + '\r\n';
  }
  return str;
}



/* To DO 

Create a better Risk Assessment model
Adjust the Hint Cost of the main gameplay loop 
Try to stabilize the RTP across different bomb counts
IMPORTANT - When playing risk averse RTP is always Positive - Make Desicion Function
Right now only works with 24 bombs (since no hints can be chosen duhhh!)
Trying a test to see if github works
*/