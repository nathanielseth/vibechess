import React, { useState } from "react";
import Navbar from "../common/Navbar";
import SettingsModal from "../common/SettingsModal";
import ShareModal from "../common/ShareModal";
import { Stack, Grid } from "@mui/material";
import { styles } from "../../styles/styles";
import "react-toastify/dist/ReactToastify.css";
import GameOverModal from "./GameOverModal";
import ChessboardComponent from "./ChessboardComponent";

const PassAndPlay = () => {
	const [isGameOver, setIsGameOver] = useState(false);
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
	const [shareModalOpen, setShareModalOpen] = useState(false);

	const closeShareModal = () => {
		setShareModalOpen(false);
	};

	const closeSettingsModal = () => {
		setIsSettingsModalOpen(false);
	};

	return (
		<Stack
			direction="column"
			justifyContent="center"
			alignItems="center"
			spacing={-10}
			minHeight="100vh"
		>
			<Navbar title="" />
			<div style={styles.passAndPlayContainerStyle}>
				<Grid
					container
					spacing={1}
					style={{ margin: 0, alignItems: "stretch" }}
				>
					<ChessboardComponent />
				</Grid>
			</div>
			<SettingsModal
				isOpen={isSettingsModalOpen}
				onClose={closeSettingsModal}
			/>
			<ShareModal isOpen={shareModalOpen} onClose={closeShareModal} />
			<GameOverModal
				isOpen={isGameOver}
				onClose={() => setIsGameOver(false)}
			/>
		</Stack>
	);
};

export default PassAndPlay;
