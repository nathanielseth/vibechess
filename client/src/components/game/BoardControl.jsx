import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Box, IconButton, Button, Grid, Tooltip } from "@mui/material";
import FirstPageRoundedIcon from "@mui/icons-material/FirstPageRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import LastPageRoundedIcon from "@mui/icons-material/LastPageRounded";
import SettingsIcon from "@mui/icons-material/Settings";
import LoopRoundedIcon from "@mui/icons-material/LoopRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { styles } from "../../styles/styles";
import ShareModal from "../common/ShareModal";

const BoardControl = ({
	currentIndex,
	navigateMove,
	history,
	toggleAutoFlip,
	autoFlip,
	toggleAnalysisMode,
	analysisMode,
	openSettingsModal,
	pgn,
	gameMode,
	handleRematch,
}) => {
	const [isShareModalOpen, setShareModalOpen] = useState(false);
	const movesBoxRef = useRef();
	const isUserNavigatingRef = useRef(false);

	const handleResign = () => {
		if (handleRematch) {
			handleRematch();
		}
	};

	const openShareModal = () => {
		setShareModalOpen(true);
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
		<Box>
			<Box
				style={{
					height: "30px",
				}}
			></Box>

			<Box sx={styles.boardControlStyle}>
				{/* Move Controls */}
				<Box
					display="flex"
					justifyContent="center"
					alignItems="center"
					height={60}
					style={{
						width: "100%",
					}}
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
						maxHeight: "30vh",
					}}
					ref={movesBoxRef}
				>
					<Grid container spacing={1}>
						{history.slice(1).map((state, index) => {
							const moveNumber = Math.floor(index / 2) + 1;
							const isWhiteMove = index % 2 === 0;
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
											backgroundColor:
												currentIndex === index + 1
													? "#000"
													: "inherit",
											color: "#fff",
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
					<Tooltip title="Evaluation Mode" enterDelay={400} arrow>
						<IconButton
							onClick={toggleAnalysisMode}
							sx={{ color: analysisMode ? "" : "grey" }}
						>
							<VisibilityRoundedIcon
								sx={{ fontSize: "1.15rem" }}
							/>
						</IconButton>
					</Tooltip>

					{gameMode !== "passandplay" && (
						<Tooltip title="Auto-Flip" enterDelay={400} arrow>
							<IconButton
								onClick={toggleAutoFlip}
								sx={{ color: autoFlip ? "" : "grey" }}
							>
								<LoopRoundedIcon sx={{ fontSize: "1.35rem" }} />
							</IconButton>
						</Tooltip>
					)}

					<Tooltip title="Resign" enterDelay={400} arrow>
						<IconButton onClick={handleResign}>
							<FlagRoundedIcon sx={{ fontSize: "1.35rem" }} />
						</IconButton>
					</Tooltip>

					{gameMode === "passandplay" && (
						<Tooltip title="Offer Draw" enterDelay={400} arrow>
							<IconButton>
								<HandshakeRoundedIcon
									sx={{ fontSize: "1.35rem" }}
								/>
							</IconButton>
						</Tooltip>
					)}

					<Tooltip title="Share" enterDelay={400} arrow>
						<IconButton onClick={openShareModal}>
							<ShareRoundedIcon sx={{ fontSize: "1.35rem" }} />
						</IconButton>
					</Tooltip>

					<Tooltip title="Settings" enterDelay={400} arrow>
						<IconButton onClick={openSettingsModal}>
							<SettingsIcon sx={{ fontSize: "1.35rem" }} />
						</IconButton>
					</Tooltip>
				</Box>
				<ShareModal
					isOpen={isShareModalOpen}
					onClose={closeShareModal}
					pgn={pgn}
				/>
			</Box>
		</Box>
	);
};

BoardControl.propTypes = {
	currentIndex: PropTypes.number.isRequired,
	navigateMove: PropTypes.func.isRequired,
	history: PropTypes.array.isRequired,
	toggleAutoFlip: PropTypes.func.isRequired,
	autoFlip: PropTypes.bool.isRequired,
	toggleAnalysisMode: PropTypes.func.isRequired,
	analysisMode: PropTypes.bool.isRequired,
	openSettingsModal: PropTypes.func.isRequired,
	openShareModal: PropTypes.func.isRequired,
	pgn: PropTypes.string.isRequired,
	gameMode: PropTypes.string,
	handleRematch: PropTypes.func.isRequired,
};

export default BoardControl;
