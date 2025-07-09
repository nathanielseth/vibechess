import React from "react";
import PropTypes from "prop-types";
import { Stack, IconButton } from "@mui/material";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import ReplayIcon from "@mui/icons-material/Replay";
import SettingsIcon from "@mui/icons-material/Settings";

const ControlPanel = ({
	isSettingsHovered,
	setIsSettingsHovered,
	openSettingsModal,
	toggleBoardOrientation,
	openShareModal,
}) => {
	return (
		<Stack
			sx={{ zIndex: 1 }}
			direction="column"
			onMouseEnter={() => setIsSettingsHovered(true)}
			onMouseLeave={() => setIsSettingsHovered(false)}
		>
			<IconButton aria-label="settings" onClick={openSettingsModal}>
				<SettingsIcon sx={{ fontSize: "1.35rem", color: "#989795" }} />
			</IconButton>

			{isSettingsHovered && (
				<>
					<IconButton
						onClick={toggleBoardOrientation}
						sx={{ fontSize: "1.20rem", color: "#989795" }}
					>
						<ReplayIcon
							sx={{ fontSize: "1.20rem", color: "#989795" }}
						/>
					</IconButton>

					<IconButton onClick={openShareModal}>
						<ShareRoundedIcon
							sx={{ fontSize: "1.20rem", color: "#989795" }}
						/>
					</IconButton>
				</>
			)}
		</Stack>
	);
};

ControlPanel.propTypes = {
	isSettingsHovered: PropTypes.bool.isRequired,
	setIsSettingsHovered: PropTypes.func.isRequired,
	openSettingsModal: PropTypes.func.isRequired,
	toggleBoardOrientation: PropTypes.func.isRequired,
	openShareModal: PropTypes.func.isRequired,
};

export default ControlPanel;
