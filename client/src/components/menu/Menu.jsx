import React, { useState, useMemo, useEffect, useContext } from "react";
import {
	Box,
	Container,
	IconButton,
	Typography,
	TextField,
	InputAdornment,
	Slide,
	Zoom,
	Tooltip,
} from "@mui/material";
import { Howl } from "howler";
import { useTheme } from "@mui/material/styles";
import GitHubIcon from "@mui/icons-material/GitHub";
import FreeBreakfastIcon from "@mui/icons-material/FreeBreakfast";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNote";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import QuizIcon from "@mui/icons-material/Quiz";
import ArrowIcon from "@mui/icons-material/ArrowForwardIosRounded";
import MusicOffRoundedIcon from "@mui/icons-material/MusicOffRounded";
import {
	PassNPlayIcon,
	MatchmakingIcon,
	PlayWithFriendIcon,
	VersusBotIcon,
	SettingsIcon,
	VibeChessLogo,
	VibeChessLogoBlack,
	styles,
	rotatingImageStyle,
	rotatingImageRotate,
} from "../../styles/styles";
import { useNavigate } from "react-router-dom";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ThemeContext } from "../../theme/ThemeContextProvider";
import socket from "../../data/socket";
import MenuButton from "./MenuButton";
import SettingsModal from "../common/modal/SettingsModal";
import TimeControlModal from "./TimeControlModal";

function Menu() {
	const theme = useTheme();
	const Icon = theme.palette.mode === "dark" ? LightModeIcon : DarkModeIcon;
	const { switchColorMode } = useContext(ThemeContext);
	switchColorMode();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const navigate = useNavigate();
	const [isMusicMuted, setIsMusicMuted] = useState(() => {
		return localStorage.getItem("isMusicMuted") === "true" || false;
	});
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
	const [isTimeControlModalOpen, setIsTimeControlModalOpen] = useState(false);
	const [isRotating, setIsRotating] = useState(false);
	const [enteredRoomCode, setEnteredRoomCode] = useState("");

	const handlePlayWithFriendClick = () => {
		clickSound.play();
		setIsTimeControlModalOpen(true);
	};

	const handleTimeControlClose = () => {
		clickSound.play();
		setIsTimeControlModalOpen(false);
	};

	const handleSettingsClick = () => {
		clickSound.play();
		setIsSettingsModalOpen(true);
	};

	const handleCloseSettingsModal = () => {
		clickSound.play();
		setIsSettingsModalOpen(false);
	};

	const handleImageClick = () => {
		setIsRotating((prevIsRotating) => !prevIsRotating);
	};

	const rotationStyle = isRotating ? rotatingImageRotate : {};

	const handlePassAndPlayClick = () => {
		clickSound.play();
		navigate("/pass-and-play");
	};

	const handleMatchmakeClick = () => {
		clickSound.play();
		navigate("/multiplayer");
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
				volume: 0.7,
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

	const handleJoinRoom = () => {
		socket.emit("joinRoom", { roomCode: enteredRoomCode });

		socket.on("roomJoined", () => {
			history.push("/multiplayer");
		});

		socket.on("roomNotFound", () => {
			console.log("room not found");
		});
	};

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				height: "100dvh",
				margin: 0,
				padding: 0,
				overflowY: { xs: "auto", sm: "auto", md: "hidden" },
				overflowX: { xs: "auto", sm: "auto", md: "hidden" },
			}}
		>
			<Container
				sx={{
					display: "flex",
					alignItems: "center",
					flexDirection: "column",
					marginBottom: isMobile ? "0" : "20px",
					marginTop: isMobile ? "30px" : "0px",
				}}
			>
				<Zoom in={true}>
					<img
						src={
							theme.palette.mode === "dark"
								? VibeChessLogo
								: VibeChessLogoBlack
						}
						alt="VibeChess Logo"
						style={{
							...rotatingImageStyle,
							...rotationStyle,
						}}
						onClick={handleImageClick}
					/>
				</Zoom>
				<Zoom in={true}>
					<Typography
						variant="h2"
						color={
							theme.palette.mode === "dark"
								? "white"
								: theme.palette.mode === "light"
								? "black"
								: "#f24040"
						}
						textAlign="center"
						style={{ textAlign: "center", fontSize: "3.5rem" }}
					>
						<span
							style={{
								color:
									theme.palette.mode === "dark"
										? "#f24040"
										: "black",
							}}
						>
							Vibe
						</span>
						Chess
					</Typography>
				</Zoom>
			</Container>

			<Box
				sx={{
					display: "flex",
					flexDirection: isMobile ? "column" : "row",
					alignItems: "center",
					marginTop: "5px",
					"&.MuiButton-root:hover": {
						bgcolor: "white",
						color: "black",
					},
				}}
			>
				{/* Main Buttons */}
				<MenuButton
					onClick={handlePassAndPlayClick}
					icon={PassNPlayIcon}
					label="PASS AND PLAY"
					backgroundColor="#c490d1"
					description="Practice locally in a solo game or pass-and-play with a friend."
				/>

				<MenuButton
					onClick={handleMatchmakeClick}
					icon={MatchmakingIcon}
					label="MATCHMAKING"
					backgroundColor="secondary.main"
					description="Search for an opponent through random matchmaking."
				/>

				<Box
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
					}}
				>
					<MenuButton
						onClick={handlePlayWithFriendClick}
						icon={PlayWithFriendIcon}
						label="PLAY WITH FRIEND"
						backgroundColor="primary.main"
						description="Create a room and invite your friend for a multiplayer match."
					/>

					<TimeControlModal
						isOpen={isTimeControlModalOpen}
						onClose={handleTimeControlClose}
						onSelectTimeControl={(timeControl) => {
							console.log("Selected Time Control:", timeControl);
							handleTimeControlClose();
						}}
					/>

					<Slide direction="up" in={true} mountOnEnter unmountOnExit>
						<TextField
							label="Room Code"
							inputProps={{ style: { fontSize: 18 } }}
							variant="outlined"
							color="primary"
							sx={{
								width: "30vh",
								marginBottom: "10px",
								[theme.breakpoints.down("sm")]: {
									height: "9vh",
									width: "45vh",
									marginBottom: "-5px",
								},
							}}
							value={enteredRoomCode}
							onChange={(e) =>
								setEnteredRoomCode(e.target.value.toUpperCase())
							}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleJoinRoom();
								}
							}}
							InputProps={{
								endAdornment: (
									<InputAdornment position="end">
										<IconButton
											sx={{
												color: "#a6a6a6",
												"&:hover, &:focus": {
													color: "primary.main",
												},
											}}
											disabled={false}
											onClick={handleJoinRoom}
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

				<MenuButton
					onClick={() => {
						clickSound.play();
					}}
					icon={VersusBotIcon}
					label="VERSUS BOT"
					backgroundColor="#F49F0A"
					description="Test your skills against an AI opponent."
				/>

				<MenuButton
					onClick={handleSettingsClick}
					icon={SettingsIcon}
					label="OPTIONS"
					backgroundColor="#565676"
					description="Adjust board theme, sound settings, and chat preferences."
				/>

				<SettingsModal
					isOpen={isSettingsModalOpen}
					onClose={handleCloseSettingsModal}
				/>
			</Box>

			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					alignItems: "center",
					marginTop: isMobile ? "0" : "25px",
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
					<Tooltip title="FAQs" arrow>
						<IconButton
							disableRipple
							onClick={() => alert("Circle Button 1")}
							style={styles.circleButtonStyle}
						>
							<QuizIcon
								sx={{ color: "#2176ff", fontSize: "20%rem" }}
							/>
						</IconButton>
					</Tooltip>
				</Slide>

				<Slide
					direction="up"
					in={true}
					style={{ transitionDelay: "150ms" }}
					mountOnEnter
					unmountOnExit
				>
					<Tooltip title="GitHub" arrow>
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
							<GitHubIcon
								sx={{ color: "primary.main", fontSize: 30 }}
							/>
						</IconButton>
					</Tooltip>
				</Slide>

				<Slide
					direction="up"
					in={true}
					style={{ transitionDelay: "200ms" }}
					mountOnEnter
					unmountOnExit
				>
					<Tooltip title="Buy Me A Coffee" arrow>
						<IconButton
							disableRipple
							onClick={() =>
								window.open(
									"https://www.buymeacoffee.com/nathanielseth",
									"_blank"
								)
							}
							style={styles.circleButtonStyle}
						>
							<FreeBreakfastIcon
								sx={{ color: "#F49F0A", fontSize: 30 }}
							/>
						</IconButton>
					</Tooltip>
				</Slide>

				<Slide
					direction="up"
					in={true}
					style={{ transitionDelay: "250ms" }}
					mountOnEnter
					unmountOnExit
				>
					<Tooltip title="Toggle UI Mode" arrow>
						<IconButton
							disableRipple
							onClick={switchColorMode}
							style={styles.circleButtonStyle}
						>
							<Icon sx={{ color: "#1f2123", fontSize: 30 }} />
						</IconButton>
					</Tooltip>
				</Slide>

				<Slide
					direction="up"
					in={true}
					style={{ transitionDelay: "300ms" }}
					mountOnEnter
					unmountOnExit
				>
					<Tooltip title="Toggle Music" arrow>
						<IconButton
							disableRipple
							onClick={handleMusicToggle}
							style={styles.circleButtonStyle}
						>
							{isMusicMuted ? (
								<MusicOffRoundedIcon
									sx={{ color: "#1f2123", fontSize: 30 }}
								/>
							) : (
								<MusicNoteRoundedIcon
									sx={{ color: "#1f2123", fontSize: 30 }}
								/>
							)}
						</IconButton>
					</Tooltip>
				</Slide>
			</Box>
		</Box>
	);
}

export default Menu;
