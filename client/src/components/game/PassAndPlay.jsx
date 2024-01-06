import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { Howl } from "howler";
import { IconButton, Box, Container, Grid, Button } from "@mui/material";
import FirstPageRoundedIcon from "@mui/icons-material/FirstPageRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import LastPageRoundedIcon from "@mui/icons-material/LastPageRounded";
import SettingsIcon from "@mui/icons-material/Settings";
import { styles } from "../../styles/styles";

const moveSound = new Howl({
	src: ["/sound/move.mp3"],
	volume: 0.6,
});

const captureSound = new Howl({
	src: ["/sound/capture.mp3"],
	volume: 0.6,
});

// bunch of spaghetti :')

const PassAndPlay = () => {
	const [game, setGame] = useState(() => new Chess());
	const [lastMove, setLastMove] = useState(null);
	const [rightClickedSquares, setRightClickedSquares] = useState({});
	const [highlightedSquares, setHighlightedSquares] = useState({});
	const [optionSquares, setOptionSquares] = useState({});
	const [moveFrom, setMoveFrom] = useState("");
	const [history, setHistory] = useState([
		{ fen: game.fen(), lastMove: null },
	]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [kingInCheck, setKingInCheck] = useState(null);

	// function safeGameMutate(modify) {
	// 	setGame((g) => {
	// 		const update = new Chess(g.fen());
	// 		modify(update);
	// 		return update;
	// 	});
	// }

	const getMoveOptions = useCallback(
		(square) => {
			const moves = game.moves({
				square,
				verbose: true,
			});

			if (moves.length === 0) {
				setOptionSquares({});
				return false;
			}

			if (currentIndex !== history.length - 1) {
				setOptionSquares({});
				setHighlightedSquares({});
				return false;
			}

			const newSquares = {};
			moves.forEach((move) => {
				const isCapture = move.flags.includes("c");
				newSquares[move.to] = isCapture
					? styles.captureSquareStyle
					: {
							background:
								game.get(move.to) &&
								game.get(move.to).color !==
									game.get(square).color
									? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
									: "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
							borderRadius: "50%",
					  };
			});

			newSquares[square] = {
				background: "rgba(255, 255, 0, 0.4)",
			};

			setOptionSquares(newSquares);
			return true;
		},
		[game, currentIndex, history.length]
	);

	const onDrop = (sourceSquare, targetSquare, piece) => {
		const gameCopy = new Chess(game.fen());
		const move = gameCopy.move({
			from: sourceSquare,
			to: targetSquare,
			promotion: piece[1].toLowerCase() ?? "q",
		});

		if (currentIndex !== history.length - 1) {
			return false;
		}

		if (move) {
			setLastMove(move);
			setHistory((prevHistory) => [
				...prevHistory,
				{ fen: gameCopy.fen(), lastMove: move },
			]);
			setHighlightedSquares({
				[sourceSquare]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
				[targetSquare]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
			});
			setKingInCheck(isKingInCheck(gameCopy));
			getMoveOptions(targetSquare);
		} else {
			setKingInCheck(null);
		}

		setGame(gameCopy);
		setOptionSquares({});
		setCurrentIndex(history.length);
		console.log(gameCopy.pgn());
		return move;
	};

	const isKingInCheck = useCallback(() => {
		if (game.inCheck()) {
			const pieces = game.board();
			for (let i = 0; i < 8; i++) {
				for (let j = 0; j < 8; j++) {
					const piece = pieces[i][j];
					if (
						piece &&
						piece.type === "k" &&
						piece.color === game.turn()
					) {
						return String.fromCharCode(97 + j) + (8 - i);
					}
				}
			}
		}
		return null;
	}, [game]);

	const onPieceDragBegin = (piece, sourceSquare) => {
		getMoveOptions(sourceSquare);
	};

	const onSquareClick = (square) => {
		setRightClickedSquares({});

		if (currentIndex !== history.length - 1) {
			return;
		}
		if (square === moveFrom) {
			setMoveFrom("");
			setOptionSquares({});
			return;
		}
		if (moveFrom) {
			const gameCopy = new Chess(game.fen());
			const move = gameCopy.move({
				from: moveFrom,
				to: square,
				promotion: "q",
			});

			if (move) {
				setLastMove(move);
				setHistory([
					...history,
					{ fen: gameCopy.fen(), lastMove: move },
				]);
				setHighlightedSquares({
					[move.from]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
					[move.to]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
				});
				setKingInCheck(isKingInCheck(gameCopy));
				setCurrentIndex(history.length);
			}

			setOptionSquares({});
			setMoveFrom("");
			setGame(gameCopy);
		} else {
			setMoveFrom(square);
			getMoveOptions(square);
		}
	};

	useEffect(() => {
		if (lastMove) {
			moveSound.play();
			if (lastMove.captured) {
				captureSound.play();
			}
			setKingInCheck(isKingInCheck());
		}
	}, [lastMove, isKingInCheck]);

	const customPieces = useMemo(() => {
		const pieces = [
			"wP",
			"wN",
			"wB",
			"wR",
			"wQ",
			"wK",
			"bP",
			"bN",
			"bB",
			"bR",
			"bQ",
			"bK",
		];

		const pieceComponents = {};
		pieces.forEach((piece) => {
			pieceComponents[piece] = ({ squareWidth }) => (
				<div
					style={{
						width: squareWidth,
						height: squareWidth,
						backgroundImage: `url(/piece/tatiana/${piece}.svg)`,
						backgroundSize: "100%",
					}}
				/>
			);
		});
		return pieceComponents;
	}, []);

	const navigateMove = useCallback(
		(moveIndex) => {
			setGame(new Chess(history[moveIndex].fen));
			setCurrentIndex(moveIndex);

			// Clear move options when navigating
			setOptionSquares({});

			// If navigating back to the current index, restore the last move's highlights
			if (moveIndex === history.length - 1 && lastMove) {
				setHighlightedSquares({
					[lastMove.from]: {
						backgroundColor: "rgba(255, 255, 0, 0.4)",
					},
					[lastMove.to]: {
						backgroundColor: "rgba(255, 255, 0, 0.4)",
					},
				});
			} else {
				// Otherwise, clear highlights
				setHighlightedSquares({});
			}
		},
		[history, lastMove] // Add lastMove to the dependency array
	);

	return (
		<Container fixed>
			<div style={styles.passAndPlayContainerStyle}>
				<Grid
					container
					spacing={1}
					style={{ margin: 0, alignItems: "stretch" }}
				>
					{/* Chessboard */}
					<Grid item xs={8}>
						<Chessboard
							id="StyledBoard"
							boardOrientation="white"
							boardWidth={700}
							position={game.fen()}
							onPieceDrop={onDrop}
							onSquareClick={onSquareClick}
							customBoardStyle={{
								borderRadius: "4px",
								boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
							}}
							customSquareStyles={{
								...highlightedSquares,
								...rightClickedSquares,
								...optionSquares,
								...(kingInCheck
									? { [kingInCheck]: styles.kingInCheckStyle }
									: {}),
							}}
							customDarkSquareStyle={{
								backgroundColor: "#84828f",
							}}
							customLightSquareStyle={{
								backgroundColor: "#eeeeee",
							}}
							customPieces={customPieces}
							onPieceDragBegin={onPieceDragBegin}
						/>
					</Grid>

					{/* Board Control Box */}
					<Grid item xs={4}>
						<Box sx={styles.boardControlStyle}>
							{/* Move Controls */}
							<Box
								display="flex"
								justifyContent="flex-start"
								alignItems="center"
								mb={2}
							>
								<IconButton
									disabled={currentIndex === 0}
									onClick={() => navigateMove(0)}
								>
									<FirstPageRoundedIcon />
								</IconButton>
								<IconButton
									disabled={currentIndex === 0}
									onClick={() =>
										navigateMove(currentIndex - 1)
									}
								>
									<ChevronLeftRoundedIcon />
								</IconButton>

								<IconButton
									disabled={
										currentIndex === history.length - 1
									}
									onClick={() =>
										navigateMove(currentIndex + 1)
									}
								>
									<ChevronRightRoundedIcon />
								</IconButton>
								<IconButton
									disabled={
										currentIndex === history.length - 1
									}
									onClick={() =>
										navigateMove(history.length - 1)
									}
								>
									<LastPageRoundedIcon />
								</IconButton>
							</Box>

							{/* Moves Box */}
							<Box
								flex="1"
								display="flex"
								flexDirection="column"
								alignItems="center"
								style={{
									overflowY: "auto",
									border: "1px solid #000",
									borderRadius: "4px",
									padding: "8px",
									width: "100%",
								}}
							>
								<Grid container spacing={1}>
									{history.slice(1).map((state, index) => {
										// Calculate the move number based on the index
										const moveNumber =
											Math.floor(index / 2) + 1;
										// Check if the move is white's move by checking if the index is even
										const isWhiteMove = index % 2 === 0;
										const move = state.lastMove;

										return isWhiteMove ? (
											// Display move number and white's move button on the same row
											<React.Fragment key={index}>
												<Grid item>
													<span>{moveNumber}.</span>
												</Grid>
												<Grid item>
													<Button
														variant="outlined"
														onClick={() =>
															navigateMove(
																index + 1
															)
														}
														sx={{
															minWidth: "48px",
															...(move && {
																borderColor:
																	"#000",
															}),
														}}
													>
														{move?.san}
													</Button>
												</Grid>
											</React.Fragment>
										) : (
											// Display black's move button on the same row as white's move
											<Grid item key={index}>
												<Button
													variant="outlined"
													onClick={() =>
														navigateMove(index + 1)
													}
													sx={{
														minWidth: "48px",
														...(move && {
															borderColor: "#000",
															backgroundColor:
																"#000",
															color: "#fff",
														}),
													}}
												>
													{move?.san}
												</Button>
											</Grid>
										);
									})}
								</Grid>
							</Box>

							{/* Settings Icon Button */}
							<Box
								display="flex"
								justifyContent="flex-end"
								alignItems="flex-end"
							>
								<IconButton>
									<SettingsIcon />
								</IconButton>
							</Box>
						</Box>
					</Grid>
				</Grid>
			</div>
		</Container>
	);
};

export default PassAndPlay;
