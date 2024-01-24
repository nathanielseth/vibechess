import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import {
	AppBar,
	Toolbar,
	Typography,
	Button,
	IconButton,
	useMediaQuery,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { VibeChessLogo, VibeChessLogoBlack } from "../../styles/styles";
import { useTheme } from "@mui/material/styles";

function Navbar({ onClick, title, gameMode }) {
	const navigate = useNavigate();
	const isXs = useMediaQuery((theme) => theme.breakpoints.down("xs"));
	const theme = useTheme();

	const handleButtonClick = onClick || (() => navigate("/"));

	return (
		<AppBar
			position="static"
			sx={{
				zIndex: 1,
				background: "none",
				boxShadow: "none",
			}}
		>
			<Toolbar
				style={{
					display: "flex",
					justifyContent: "space-between",
				}}
			>
				{gameMode === "multiplayer" ? (
					<Toolbar
						style={{
							display: "flex",
							justifyContent: "space-between",
						}}
					>
						{isXs ? (
							<IconButton
								title="Go back to the main menu"
								edge="start"
								onClick={handleButtonClick}
								sx={{
									ml: 1,
									mt: 1,
								}}
							>
								<img
									src={
										theme.palette.mode === "dark"
											? VibeChessLogo
											: VibeChessLogoBlack
									}
									alt="VibeChess Logo"
									style={{
										width: "38px",
										height: "auto",
									}}
								/>
							</IconButton>
						) : (
							<>
								<IconButton
									title="Go back to the main menu"
									edge="start"
									onClick={handleButtonClick}
									sx={{
										ml: 1,
										mt: 1,
									}}
								>
									<img
										src={
											theme.palette.mode === "dark"
												? VibeChessLogo
												: VibeChessLogoBlack
										}
										alt="VibeChess Logo"
										style={{
											width: "40px",
											height: "auto",
										}}
									/>
								</IconButton>
								<div style={{ width: 48 }} />{" "}
							</>
						)}
						<Typography
							variant="h4"
							style={{
								color:
									theme.palette.mode === "light"
										? "#000"
										: "gray",
							}}
						>
							{title}
						</Typography>
					</Toolbar>
				) : (
					<Button
						variant="outlined"
						edge="start"
						onClick={handleButtonClick}
						sx={{
							color:
								theme.palette.mode === "light"
									? "#000"
									: "rgba(255, 255, 255, 0.8)",
							borderColor:
								theme.palette.mode === "light"
									? "#000"
									: "rgba(255, 255, 255, 0.8)",
							"&:hover": {
								backgroundColor: theme.palette.primary.main,
							},
							ml: isXs ? 1 : 0,
							mt: isXs ? 1 : 0,
						}}
					>
						<ArrowBackRoundedIcon sx={{ mr: 1 }} />
						Go back to menu
					</Button>
				)}

				<Typography
					variant="h4"
					style={{
						color:
							theme.palette.mode === "light" ? "#000" : "inherit",
					}}
				>
					{title}
				</Typography>
			</Toolbar>
		</AppBar>
	);
}

Navbar.propTypes = {
	onClick: PropTypes.func,
	title: PropTypes.string,
	gameMode: PropTypes.string,
};

export default Navbar;
