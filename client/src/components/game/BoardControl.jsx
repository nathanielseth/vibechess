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
import { styles } from "../../styles/styles";
import ShareModal from "../common/ShareModal";

const BoardControl = ({
	currentIndex,
	navigateMove,
	history,
	toggleAutoFlip,
	autoFlip,
	openSettingsModal,
	pgn,
	gameMode,
	handleRematch,
}) => {
	const [isShareModalOpen, setShareModalOpen] = useState(false);
	const movesBoxRef = useRef();

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
		if (movesBoxRef.current) {
			movesBoxRef.current.scrollTop = movesBoxRef.current.scrollHeight;
		}
	}, [currentIndex]);

	return (
		<Box sx={styles.boardControlStyle}>
			{/* Move Controls */}
			<Box
				display="flex"
				justifyContent="flex-start"
				alignItems="center"
				style={{
					marginTop: "6px",
				}}
			>
				<IconButton
					disabled={currentIndex === 0}
					onClick={() => navigateMove(0)}
				>
					<FirstPageRoundedIcon sx={{ fontSize: "1.9rem" }} />
				</IconButton>
				<IconButton
					disabled={currentIndex === 0}
					onClick={() => navigateMove(currentIndex - 1)}
				>
					<ChevronLeftRoundedIcon sx={{ fontSize: "1.9rem" }} />
				</IconButton>
				<IconButton
					disabled={currentIndex === history.length - 1}
					onClick={() => navigateMove(currentIndex + 1)}
				>
					<ChevronRightRoundedIcon sx={{ fontSize: "1.9rem" }} />
				</IconButton>
				<IconButton
					disabled={currentIndex === history.length - 1}
					onClick={() => navigateMove(history.length - 1)}
				>
					<LastPageRoundedIcon sx={{ fontSize: "1.9rem" }} />
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
					padding: "8px",
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
									onClick={() => navigateMove(index + 1)}
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
									{isWhiteMove && <span>{moveNumber}.</span>}{" "}
									{state.lastMove?.san}
								</Button>
							</Grid>
						);
					})}
				</Grid>
			</Box>
			<Box display="flex" justifyContent="flex-end" alignItems="flex-end">
				{gameMode !== "passandplay" && (
					<Tooltip title="Auto-Flip" enterDelay={400}>
						<IconButton
							onClick={toggleAutoFlip}
							sx={{ color: autoFlip ? "" : "grey" }}
						>
							<LoopRoundedIcon />
						</IconButton>
					</Tooltip>
				)}

				<Tooltip title="Resign" enterDelay={400}>
					<IconButton onClick={handleResign}>
						<FlagRoundedIcon />
					</IconButton>
				</Tooltip>

				{gameMode === "passandplay" && (
					<Tooltip title="Offer Draw" enterDelay={400}>
						<IconButton>
							<HandshakeRoundedIcon />
						</IconButton>
					</Tooltip>
				)}

				<Tooltip title="Share" enterDelay={400}>
					<IconButton onClick={openShareModal}>
						<ShareRoundedIcon />
					</IconButton>
				</Tooltip>

				<Tooltip title="Settings" enterDelay={400}>
					<IconButton onClick={openSettingsModal}>
						<SettingsIcon />
					</IconButton>
				</Tooltip>
			</Box>
			<ShareModal
				isOpen={isShareModalOpen}
				onClose={closeShareModal}
				pgn={pgn}
			/>
		</Box>
	);
};

BoardControl.propTypes = {
	currentIndex: PropTypes.number.isRequired,
	navigateMove: PropTypes.func.isRequired,
	history: PropTypes.array.isRequired,
	toggleAutoFlip: PropTypes.func.isRequired,
	autoFlip: PropTypes.bool.isRequired,
	openSettingsModal: PropTypes.func.isRequired,
	openShareModal: PropTypes.func.isRequired,
	pgn: PropTypes.string.isRequired,
	gameMode: PropTypes.string.isRequired,
	handleRematch: PropTypes.string.isRequired,
};

export default BoardControl;
