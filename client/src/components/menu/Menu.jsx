import React, { useState, useMemo, useEffect } from "react";
import {
	Box,
	Button,
	Container,
	IconButton,
	Typography,
	TextField,
	InputAdornment,
	Slide,
	Zoom,
} from "@mui/material";
import {
	PassNPlayIcon,
	MatchmakingIcon,
	PlayWithFriendsIcon,
	VersusBotIcon,
	SettingsIcon,
	VibeChessLogo,
	styles,
} from "../../styles/styles";
import GitHubIcon from "@mui/icons-material/GitHub";
import FreeBreakfastIcon from "@mui/icons-material/FreeBreakfast";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNote";
import LightModeIcon from "@mui/icons-material/LightMode";
import QuizIcon from "@mui/icons-material/Quiz";
import ArrowIcon from "@mui/icons-material/ArrowForwardIosRounded";
import MusicOffRoundedIcon from "@mui/icons-material/MusicOffRounded";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { Howl } from "howler";

const ActionButton = React.memo(
	({ onClick, icon, label, backgroundColor, description }) => (
		<Slide direction="up" in={true} mountOnEnter unmountOnExit>
			<Button
				onClick={onClick}
				variant="contained"
				sx={{
					...styles.commonButtonStyles,
					backgroundColor,
					position: "relative",
					overflow: "hidden",
					"&:hover": {
						"& img": { filter: "brightness(0%)" },
						"& .description": {
							position: "relative",
							visibility: "visible",
							transform: "translateY(-10px)",
							transition:
								"transform 0.5s ease, opacity 0.5s ease",
							opacity: 1,
						},
						"& .buttonContent": {
							transform: "translateY(-20px)",
							transition: "transform 0.5s ease",
						},
					},
					"&.MuiButton-root:hover": {
						bgcolor: "white",
						color: "black",
					},
					".MuiTouchRipple-child": {
						backgroundColor: "#ce1126",
					},
				}}
			>
				<Box
					className="buttonContent"
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						transition: "transform 0.5s ease",
					}}
				>
					<Typography
						variant="body2"
						className="empty-space"
						sx={{
							visibility: "hidden",
						}}
					>
						{description}
					</Typography>
					<img src={icon} alt="Icon" style={styles.iconStyles} />
					<Typography variant="h5" sx={styles.buttonTextStyles}>
						{label}
					</Typography>
					<Typography
						variant="body2"
						className="description"
						sx={{
							top: "100%",
							left: "0",
							width: "100%",
							fontSize: 12,
							visibility: "hidden",
							transform: "translateY(0)",
							mt: "15px",
							opacity: 0,
						}}
					>
						{description}
					</Typography>
				</Box>
			</Button>
		</Slide>
	)
);
ActionButton.displayName = "ActionButton";

ActionButton.propTypes = {
	onClick: PropTypes.func.isRequired,
	icon: PropTypes.string.isRequired,
	label: PropTypes.string.isRequired,
	backgroundColor: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
};

function Menu() {
	const navigate = useNavigate();
	const [isMusicMuted, setIsMusicMuted] = useState(() => {
		return localStorage.getItem("isMusicMuted") === "true" || false;
	});

	const handlePassAndPlayClick = () => {
		clickSound.play();
		navigate("/pass-and-play");
	};

	const music = useMemo(
		() =>
			new Howl({
				src: ["/sound/music.mp3"],
				loop: true,
				volume: 0.5,
			}),
		[]
	);

	const clickSound = useMemo(
		() =>
			new Howl({
				src: ["/sound/click.mp3"],
				volume: 0.6,
			}),
		[]
	);

	const handleMusicToggle = () => {
		if (isMusicMuted) {
			music.play();
		} else {
			music.stop();
		}
		setIsMusicMuted(!isMusicMuted);
	};

	useEffect(() => {
		if (!isMusicMuted) {
			music.play();
		} else {
			music.stop();
		}

		localStorage.setItem("isMusicMuted", String(isMusicMuted));

		return () => music.stop();
	}, [isMusicMuted, music]);

	return (
		<Box
			sx={{
				backgroundColor: "#101010",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				height: "100vh",
				margin: 0,
				padding: 0,
				overflow: "hidden",
			}}
		>
			<Container
				sx={{
					display: "flex",
					alignItems: "center",
					flexDirection: "column",
					marginBottom: "20px",
				}}
			>
				<Zoom in={true}>
					<img
						src={VibeChessLogo}
						alt="VibeChess Logo"
						style={{
							width: "120px",
							height: "auto",
							marginBottom: "10px",
						}}
					/>
				</Zoom>
				<Zoom in={true}>
					<Typography variant="h2" color="white" textAlign="center">
						<span style={{ color: "#ce1126" }}>Vibe</span>Chess
					</Typography>
				</Zoom>
			</Container>

			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					alignItems: "center",
					marginTop: "5px",
					"&.MuiButton-root:hover": {
						bgcolor: "white",
						color: "black",
					},
				}}
			>
				{/* Main Buttons */}
				<ActionButton
					onClick={handlePassAndPlayClick}
					icon={PassNPlayIcon}
					label="PASS AND PLAY"
					backgroundColor="#d264b6"
					description="Practice locally in a solo game or pass-and-play with friends."
				/>

				<ActionButton
					onClick={() => {
						clickSound.play();
					}}
					icon={MatchmakingIcon}
					label="MATCHMAKING"
					backgroundColor="#2176ff"
					description="Search for an opponent through random matchmaking."
				/>

				<Box
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
					}}
				>
					<ActionButton
						onClick={() => {
							clickSound.play();
						}}
						icon={PlayWithFriendsIcon}
						label="PLAY WITH FRIENDS"
						backgroundColor="#ce1126"
						description="Create a room and invite your friend for a multiplayer match."
					/>

					<Slide direction="up" in={true} mountOnEnter unmountOnExit>
						<TextField
							label="Room Code"
							variant="outlined"
							color="primary"
							sx={{ width: "30vh", marginBottom: "10px" }}
							InputProps={{
								endAdornment: (
									<InputAdornment position="end">
										<IconButton
											sx={{
												color: "#a6a6a6",
												"&:hover, &:focus": {
													color: "#ce1126",
												},
											}}
											disabled={false}
											onClick={null}
											edge="end"
										>
											<ArrowIcon />
										</IconButton>
									</InputAdornment>
								),
							}}
						/>
					</Slide>
				</Box>

				<ActionButton
					onClick={() => {
						clickSound.play();
					}}
					icon={VersusBotIcon}
					label="VERSUS BOT"
					backgroundColor="#fb8b24"
					description="Test your skills against an AI opponent."
				/>

				<ActionButton
					onClick={() => {
						clickSound.play();
					}}
					icon={SettingsIcon}
					label="OPTIONS"
					backgroundColor="#4c6663"
					description="Adjust board theme, sound settings, and chat preferences."
				/>
			</Box>

			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					alignItems: "center",
					marginTop: "25px",
				}}
			>
				{/* Icon Buttons */}
				<Slide
					direction="up"
					in={true}
					style={{ transitionDelay: "100ms" }}
					mountOnEnter
					unmountOnExit
				>
					<IconButton
						disableRipple
						onClick={() => alert("Circle Button 1")}
						style={styles.circleButtonStyle}
					>
						<QuizIcon sx={{ color: "#2176ff", fontSize: 30 }} />
					</IconButton>
				</Slide>

				<Slide
					direction="up"
					in={true}
					style={{ transitionDelay: "150ms" }}
					mountOnEnter
					unmountOnExit
				>
					<IconButton
						disableRipple
						onClick={() =>
							window.open(
								"https://github.com/nathanielseth/VibeChess",
								"_blank"
							)
						}
						style={styles.circleButtonStyle}
					>
						<GitHubIcon sx={{ color: "#ce1126", fontSize: 30 }} />
					</IconButton>
				</Slide>

				<Slide
					direction="up"
					in={true}
					style={{ transitionDelay: "200ms" }}
					mountOnEnter
					unmountOnExit
				>
					<IconButton
						disableRipple
						onClick={() => alert("Circle Button 3")}
						style={styles.circleButtonStyle}
					>
						<FreeBreakfastIcon
							sx={{ color: "#fb8b24", fontSize: 30 }}
						/>
					</IconButton>
				</Slide>

				<Slide
					direction="up"
					in={true}
					style={{ transitionDelay: "250ms" }}
					mountOnEnter
					unmountOnExit
				>
					<IconButton
						disableRipple
						onClick={() => alert("Circle Button 4")}
						style={styles.circleButtonStyle}
					>
						<LightModeIcon sx={{ fontSize: 30 }} />
					</IconButton>
				</Slide>

				<Slide
					direction="up"
					in={true}
					style={{ transitionDelay: "300ms" }}
					mountOnEnter
					unmountOnExit
				>
					<IconButton
						disableRipple
						onClick={handleMusicToggle}
						style={styles.circleButtonStyle}
					>
						{isMusicMuted ? (
							<MusicOffRoundedIcon sx={{ fontSize: 30 }} />
						) : (
							<MusicNoteRoundedIcon sx={{ fontSize: 30 }} />
						)}
					</IconButton>
				</Slide>
			</Box>
		</Box>
	);
}

export default Menu;
