import React, { useState, useMemo, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { Howl } from "howler";

const moveSound = new Howl({
	src: ["/sound/move.mp3"],
	volume: 0.6,
});

const captureSound = new Howl({
	src: ["/sound/capture.mp3"],
	volume: 0.6,
});

const containerStyle = {
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	height: "100vh",
	width: "100vw",
};

const boardWrapper = {
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
};

const buttonStyle = {
	marginTop: "10px",
	padding: "5px 10px",
	fontSize: "16px",
	cursor: "pointer",
};

const PassAndPlay = () => {
	const [game, setGame] = useState(() => new Chess());
	const [lastMove, setLastMove] = useState(null);
	const [rightClickedSquares, setRightClickedSquares] = useState({});
	const [optionSquares, setOptionSquares] = useState({});
	const [moveFrom, setMoveFrom] = useState("");

	function safeGameMutate(modify) {
		setGame((g) => {
			const update = new Chess(g.fen());
			modify(update);
			return update;
		});
	}

	const getMoveOptions = (square) => {
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
			newSquares[move.to] = {
				background:
					game.get(move.to) &&
					game.get(move.to).color !== game.get(square).color
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
	};

	const onDrop = (sourceSquare, targetSquare, piece) => {
		const gameCopy = new Chess(game.fen());
		const move = gameCopy.move({
			from: sourceSquare,
			to: targetSquare,
			promotion: piece[1].toLowerCase() ?? "q",
		});

		if (move) {
			setLastMove(move);
		}

		setOptionSquares({});
		setGame(gameCopy);
		console.log(gameCopy.pgn());
		return move;
	};

	const onSquareClick = (square) => {
		setRightClickedSquares({});
		setMoveFrom("");
		setOptionSquares({});

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
		}
	}, [lastMove]);

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

	return (
		<div style={containerStyle}>
			<div style={boardWrapper}>
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
						...optionSquares,
						...rightClickedSquares,
					}}
					customDarkSquareStyle={{ backgroundColor: "#84828f" }}
					customLightSquareStyle={{ backgroundColor: "#eeeeee" }}
					customPieces={customPieces}
				/>
				<button
					style={buttonStyle}
					onClick={() => {
						safeGameMutate((game) => {
							game.reset();
							setLastMove(null);
						});
					}}
				>
					reset
				</button>
				<button
					style={buttonStyle}
					onClick={() => {
						safeGameMutate((game) => {
							game.undo();
							setLastMove(null);
						});
					}}
				>
					undo
				</button>
			</div>
		</div>
	);
};

export default PassAndPlay;
