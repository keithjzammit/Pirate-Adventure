const XLSX = require('xlsx');

function simulateGames(iterations = 10000, startingPoints = 100, bombCount = 5) {
	isSimulationMode = true; // Enter simulation mode
	const results = [];

	for (let i = 0; i < iterations; i++) {
		startGame(startingPoints, bombCount);
		let gameResult = {
			gameNumber: i + 1,
			moneyWon: 0,
			moneySpentOnHints: 0,
			hintsBought: 0,
			cellsRevealed: 0,
			outcome: 'Lost'
		};

		while (!gameOver) {
			const decision = makeDecision();
			
			switch(decision) {
				case 'reveal':
					const cellToReveal = chooseCellToReveal();
					revealCell(cellToReveal.row, cellToReveal.col);
					gameResult.cellsRevealed++;
					break;
				case 'hint':
					const hintCost = buyHint();
					gameResult.moneySpentOnHints += hintCost;
					gameResult.hintsBought++;
					break;
				case 'cashout':
					stopGame();
					break;
			}
		}

		gameResult.moneyWon = points;
		gameResult.outcome = points > 0 ? 'Won' : 'Lost';
		results.push(gameResult);
	}

	isSimulationMode = false; // Exit simulation mode
	exportToExcel(results);
}

function makeDecision() {
	const riskLevel = calculateRiskLevel();
	const potentialReward = calculatePotentialReward();
	const hintCost = estimateHintCost();

	if (riskLevel > 0.7) {
		// High risk, consider cashing out or buying a hint
		return Math.random() < 0.5 ? 'cashout' : 'hint';
	} else if (riskLevel > 0.4 && hintCost < potentialReward * 0.2) {
		// Medium risk, buy a hint if it's relatively cheap
		return 'hint';
	} else {
		// Low to medium risk, reveal a cell
		return 'reveal';
	}
}

function calculateRiskLevel() {
	const revealedCount = board.flat().filter(cell => cell === 1).length;
	const totalCells = BOARD_SIZE * BOARD_SIZE;
	const remainingCells = totalCells - revealedCount;
	return bombs / remainingCells;
}

function calculatePotentialReward() {
	return calculatePoints(revealedCells + 1, BOARD_SIZE * BOARD_SIZE, bombs) * startPoints;
}

function estimateHintCost() {
	// This is a simplified estimation. You might want to use the actual hint cost calculation here.
	return calculatePotentialReward() * HINT_BASE_COST_FACTOR;
}

function chooseCellToReveal() {
	const unrevealedCells = [];
	for (let row = 0; row < BOARD_SIZE; row++) {
		for (let col = 0; col < BOARD_SIZE; col++) {
			if (board[row][col] === 0) {
				unrevealedCells.push({row, col});
			}
		}
	}
	// Choose a random unrevealed cell
	return unrevealedCells[Math.floor(Math.random() * unrevealedCells.length)];
}

function exportToExcel(results) {
	const ws = XLSX.utils.json_to_sheet(results);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "Game Results");
	XLSX.writeFile(wb, "game_simulation_results.xlsx");
}

// Run the simulation
simulateGames();