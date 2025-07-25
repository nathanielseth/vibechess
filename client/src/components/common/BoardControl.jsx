import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Box, IconButton, Button, Grid, Tooltip, Stack } from "@mui/material";
import FirstPageRoundedIcon from "@mui/icons-material/FirstPageRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import LastPageRoundedIcon from "@mui/icons-material/LastPageRounded";
import LoopRoundedIcon from "@mui/icons-material/LoopRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import { styles } from "../../styles/styles";
import ShareModal from "./modal/ShareModal";
import ConfirmationModal from "../common/modal/ConfirmationModal";
import GameOverModal from "../common/modal/GameOverModal";
import { useTheme } from "@mui/material/styles";

const BoardControl = ({
	currentIndex,
	navigateMove,
	history,
	toggleAutoFlip = null,
	autoFlip = false,
	toggleAnalysisMode = null,
	analysisMode = false,
	pgn,
	gameMode = "versus-bot",
	handleUndoMove,
	setIsGameOver,
}) => {
	const theme = useTheme();
	const [isShareModalOpen, setShareModalOpen] = useState(false);
	const [isConfirmationModalOpen, setConfirmationModalOpen] = useState(false);
	const [isGameOverModalOpen, setGameOverModalOpen] = useState(false);
	const [confirmationMessage, setConfirmationMessage] = useState("");
	const [resignationReason, setResignationReason] = useState("");
	const [isResignation, setIsResignation] = useState(false);

	const movesBoxRef = useRef();
	const isUserNavigatingRef = useRef(false);

	const handleResign = () => {
		setConfirmationMessage("Resign the game?");
		setResignationReason("Resigned");
		setIsResignation(true);
		setConfirmationModalOpen(true);
	};

	const handleDraw = () => {
		setConfirmationMessage("Offer a draw?");
		setIsResignation(false);
		setConfirmationModalOpen(true);
	};

	const handleConfirmation = () => {
		if (resignationReason === "Resigned") {
			setGameOverModalOpen(true);
		} else {
			// Handle other confirmation actions
		}
		setConfirmationModalOpen(false);
	};

	const closeShareModal = () => {
		setShareModalOpen(false);
	};

	useEffect(() => {
		if (!isUserNavigatingRef.current && movesBoxRef.current) {
			if (currentIndex === 0) {
				movesBoxRef.current.scrollTop = 0;
			} else {
				movesBoxRef.current.scrollTop =
					movesBoxRef.current.scrollHeight;
			}
		}
		isUserNavigatingRef.current = false;
	}, [currentIndex]);

	const pieceNotationToUnicode = (notation) => {
		const pieceMap = {
			P: "♙",
			p: "♟",
			K: "♚",
			Q: "♛",
			R: "♜",
			B: "♝",
			N: "♞",
		};

		return pieceMap[notation] || notation;
	};

	return (
		<Stack>
			<Stack
				sx={{
					...styles.boardControlStyle,
					backgroundColor:
						theme.palette.mode === "light" ? "#fff" : "#1f2123",
				}}
			>
				{/* Move Controls */}
				<Box
					display="flex"
					justifyContent="center"
					alignItems="center"
					height={60}
				>
					<IconButton
						disabled={currentIndex === 0}
						onClick={() => navigateMove(0)}
					>
						<FirstPageRoundedIcon sx={{ fontSize: "2.0rem" }} />
					</IconButton>
					<IconButton
						disabled={currentIndex === 0}
						onClick={() => navigateMove(currentIndex - 1)}
					>
						<ChevronLeftRoundedIcon sx={{ fontSize: "2.0rem" }} />
					</IconButton>
					<IconButton
						disabled={currentIndex === history.length - 1}
						onClick={() => navigateMove(currentIndex + 1)}
					>
						<ChevronRightRoundedIcon sx={{ fontSize: "2.0rem" }} />
					</IconButton>
					<IconButton
						disabled={currentIndex === history.length - 1}
						onClick={() => navigateMove(history.length - 1)}
					>
						<LastPageRoundedIcon sx={{ fontSize: "2.0rem" }} />
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
						borderRadius: "4px",
						paddingLeft: "15px",
						paddingRight: "15px",
						width: "100%",
						height: "30vh",
					}}
					ref={movesBoxRef}
				>
					<Grid container spacing={1}>
						{history.slice(1).map((state, index) => {
							const moveNumber = Math.floor(index / 2) + 1;
							const isWhiteMove = index % 2 === 0;
							const isCurrentMove = currentIndex === index + 1;
							return (
								<Grid item key={index} xs={6}>
									<Button
										variant="outlined"
										onClick={() => {
											isUserNavigatingRef.current = true;
											navigateMove(index + 1);
										}}
										sx={{
											width: "100%",
											borderColor: "#000",
											backgroundColor: isCurrentMove
												? "#000"
												: "inherit",
											color: isCurrentMove
												? "#fff"
												: theme.palette.mode === "light"
												? "black"
												: "inherit",
										}}
									>
										{isWhiteMove && (
											<span>{moveNumber}.</span>
										)}{" "}
										{state.lastMove?.san
											.split("")
											.map((char, charIndex) => (
												<span key={charIndex}>
													{pieceNotationToUnicode(
														char
													)}
												</span>
											))}
									</Button>
								</Grid>
							);
						})}
					</Grid>
				</Box>
				<Box
					display="flex"
					justifyContent="center"
					alignItems="center"
					style={{ width: "100%" }}
				>
					<Tooltip title="Undo Move" enterDelay={400} arrow>
						<IconButton
							sx={{
								color: currentIndex === 0 ? "grey" : "#989795",
							}}
							onClick={handleUndoMove}
						>
							<UndoRoundedIcon sx={{ fontSize: "1.35rem" }} />
						</IconButton>
					</Tooltip>

					{gameMode === "passandplay" && toggleAnalysisMode && (
						<Tooltip title="Evaluation Mode" enterDelay={400} arrow>
							<IconButton
								onClick={toggleAnalysisMode}
								sx={{ color: analysisMode ? "" : "#989795" }}
							>
								<VisibilityRoundedIcon
									sx={{ fontSize: "1.15rem" }}
								/>
							</IconButton>
						</Tooltip>
					)}

					{gameMode === "passandplay" && toggleAutoFlip && (
						<Tooltip title="Auto-Flip" enterDelay={400} arrow>
							<IconButton
								onClick={toggleAutoFlip}
								sx={{ color: autoFlip ? "" : "#989795" }}
							>
								<LoopRoundedIcon sx={{ fontSize: "1.35rem" }} />
							</IconButton>
						</Tooltip>
					)}

					<Tooltip title="Resign" enterDelay={400} arrow>
						<IconButton onClick={handleResign}>
							<FlagRoundedIcon
								sx={{ fontSize: "1.35rem", color: "#989795" }}
							/>
						</IconButton>
					</Tooltip>

					{gameMode !== "passandplay" && (
						<Tooltip title="Offer Draw" enterDelay={400} arrow>
							<IconButton onClick={handleDraw}>
								<HandshakeRoundedIcon
									sx={{
										fontSize: "1.35rem",
										color: "#989795",
									}}
								/>
							</IconButton>
						</Tooltip>
					)}
				</Box>
				<ShareModal
					isOpen={isShareModalOpen}
					onClose={closeShareModal}
					pgn={pgn}
				/>
				<ConfirmationModal
					isOpen={isConfirmationModalOpen}
					onClose={() => setConfirmationModalOpen(false)}
					onConfirm={handleConfirmation}
					message={confirmationMessage}
					isResignation={isResignation}
					setIsGameOver={setIsGameOver}
				/>
				{gameMode !== "passandplay" && (
					<GameOverModal
						isOpen={isGameOverModalOpen}
						onClose={() => setGameOverModalOpen(false)}
						endReason={resignationReason}
					/>
				)}
			</Stack>
		</Stack>
	);
};

BoardControl.propTypes = {
	currentIndex: PropTypes.number.isRequired,
	navigateMove: PropTypes.func.isRequired,
	history: PropTypes.array.isRequired,
	toggleAutoFlip: PropTypes.func,
	autoFlip: PropTypes.bool,
	toggleAnalysisMode: PropTypes.func,
	analysisMode: PropTypes.bool,
	pgn: PropTypes.string.isRequired,
	gameMode: PropTypes.string,
	handleUndoMove: PropTypes.func.isRequired,
	setIsGameOver: PropTypes.func.isRequired,
};

export default BoardControl;
