import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { Howl } from "howler";
import { IconButton, Box, Container, Grid } from "@mui/material";
import FirstPageRoundedIcon from "@mui/icons-material/FirstPageRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import LastPageRoundedIcon from "@mui/icons-material/LastPageRounded";
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
		[game]
	);

	const onDrop = (sourceSquare, targetSquare, piece) => {
		const gameCopy = new Chess(game.fen());
		const move = gameCopy.move({
			from: sourceSquare,
			to: targetSquare,
			promotion: piece[1].toLowerCase() ?? "q",
		});

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
		setMoveFrom("");
		setOptionSquares({});

		if (square === moveFrom) {
			setMoveFrom("");
			setOptionSquares({});
			return;
		}

		const hasMoveOptions = getMoveOptions(square);

		if (hasMoveOptions) {
			setMoveFrom(square);
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
				setHighlightedSquares({
					[moveFrom]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
					[square]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
				});
			}

			setGame(gameCopy);
			setMoveFrom("");
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

	const navigateMove = (index) => {
		setCurrentIndex(index);
		setGame(new Chess(history[index].fen));
	};

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

					{/* Tracker Box */}
					<Grid item xs={4}>
						<Box sx={styles.trackerBoxStyle}>
							<Box>
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

							<Box
								flex="1"
								display="flex"
								flexDirection="column"
								alignItems="center"
								style={{ overflowY: "auto" }}
							>
								{history.map((state, index) => (
									<div
										key={index}
										onClick={() => navigateMove(index)}
										style={{
											cursor: "pointer",
											padding: "5px",
											border:
												index === currentIndex
													? "2px solid #000"
													: "none",
										}}
									>
										{state.lastMove
											? `${state.lastMove.from}-${state.lastMove.to}`
											: ""}
									</div>
								))}
							</Box>

							<Box
								display="flex"
								justifyContent="center"
								backgroundColor="black"
								mt={4}
								sx={{
									width: "100%",
									height: 100,
									bgcolor: "#1f2123",
								}}
							></Box>
						</Box>
					</Grid>
				</Grid>
			</div>
		</Container>
	);
};

export default PassAndPlay;
