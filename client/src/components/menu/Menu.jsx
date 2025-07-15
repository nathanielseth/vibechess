import React, { useState, useMemo, useContext, useCallback } from "react";
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
import { ThemeContext } from "../../theme/ThemeContext";
import MenuButton from "./MenuButton";
import SettingsModal from "../common/modal/SettingsModal";
import TimeControlModal from "./TimeControlModal";
import FAQModal from "../common/modal/FAQModal";
import useSocketContext from "../../context/useSocketContext";

import { useMenuSounds } from "../../hooks/useMenuSounds";
import { useMatchmaking } from "../../hooks/useMatchmaking";
import { useRoomJoining } from "../../hooks/useRoomJoining";
import { useMenuNavigation } from "../../hooks/useMenuNavigation";

const Menu = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const { switchColorMode } = useContext(ThemeContext);
	const { isConnected } = useSocketContext();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
	const [isTimeControlModalOpen, setIsTimeControlModalOpen] = useState(false);
	const [isFAQModalOpen, setIsFAQModalOpen] = useState(false);
	const [isRotating, setIsRotating] = useState(false);

	const { isMusicMuted, playClickSound, handleMusicToggle } = useMenuSounds();
	const { isSearching, handleMatchmakeClick } = useMatchmaking();
	const { enteredRoomCode, setEnteredRoomCode, handleJoinRoom } =
		useRoomJoining();
	const {
		handlePassAndPlayClick,
		handlePlayWithFriendClick,
		handleVersusBotClick,
		handleSettingsClick,
	} = useMenuNavigation(playClickSound);

	const handleImageClick = useCallback(() => {
		setIsRotating((prev) => !prev);
	}, []);

	const handleTimeControlClose = useCallback(() => {
		playClickSound();
		setIsTimeControlModalOpen(false);
	}, [playClickSound]);

	const handleCloseSettingsModal = useCallback(() => {
		playClickSound();
		setIsSettingsModalOpen(false);
	}, [playClickSound]);

	const handlePlayWithFriendWrapper = useCallback(() => {
		const shouldOpen = handlePlayWithFriendClick();
		if (shouldOpen) {
			setIsTimeControlModalOpen(true);
		}
	}, [handlePlayWithFriendClick]);

	const handleSettingsWrapper = useCallback(() => {
		const shouldOpen = handleSettingsClick();
		if (shouldOpen) {
			setIsSettingsModalOpen(true);
		}
	}, [handleSettingsClick]);

	const handleMatchmakeWrapper = useCallback(() => {
		playClickSound();
		handleMatchmakeClick();
	}, [playClickSound, handleMatchmakeClick]);

	const handleJoinRoomWrapper = useCallback(() => {
		playClickSound();
		handleJoinRoom();
	}, [playClickSound, handleJoinRoom]);

	const iconButtons = useMemo(
		() => [
			{
				icon: QuizIcon,
				title: "FAQs",
				color: "#2176ff",
				onClick: () => {
					playClickSound();
					setIsFAQModalOpen(true);
				},
			},
			{
				icon: GitHubIcon,
				title: "GitHub",
				color: "primary.main",
				onClick: () =>
					window.open(
						"https://github.com/nathanielseth/VibeChess",
						"_blank"
					),
			},
			{
				icon: FreeBreakfastIcon,
				title: "Buy Me A Coffee",
				color: "#F49F0A",
				onClick: () =>
					window.open(
						"https://www.buymeacoffee.com/nathanielseth",
						"_blank"
					),
			},
			{
				icon:
					theme.palette.mode === "dark"
						? LightModeIcon
						: DarkModeIcon,
				title: "Toggle UI Mode",
				color: "#1f2123",
				onClick: switchColorMode,
			},
			{
				icon: isMusicMuted ? MusicOffRoundedIcon : MusicNoteRoundedIcon,
				title: "Toggle Music",
				color: "#1f2123",
				onClick: handleMusicToggle,
			},
		],
		[
			theme.palette.mode,
			switchColorMode,
			isMusicMuted,
			handleMusicToggle,
			playClickSound,
		]
	);

	const rotationStyle = isRotating ? rotatingImageRotate : {};
	const iconSize = isMobile ? 24 : 26;

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
			{/* Title */}
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
							cursor: "pointer",
						}}
						onClick={handleImageClick}
					/>
				</Zoom>
				<Zoom in={true}>
					<Typography
						variant="h2"
						color={
							theme.palette.mode === "dark" ? "white" : "black"
						}
						textAlign="center"
						sx={{ fontSize: "3.5rem" }}
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

			{/* Main Menu Buttons */}
			<Box
				sx={{
					display: "flex",
					flexDirection: isMobile ? "column" : "row",
					alignItems: "center",
					marginTop: "5px",
					flexWrap: "nowrap",
					overflowX: isMobile ? "visible" : "auto",
					overflowY: "visible",
					width: "100%",
					justifyContent: "center",
				}}
			>
				<MenuButton
					onClick={handlePassAndPlayClick}
					icon={PassNPlayIcon}
					label="PASS AND PLAY"
					backgroundColor="#c490d1"
					description="Practice locally in a solo game or pass-and-play with a friend."
				/>

				<MenuButton
					onClick={handleMatchmakeWrapper}
					icon={MatchmakingIcon}
					label={isSearching ? "CANCEL SEARCH" : "MATCHMAKING"}
					backgroundColor={isSearching ? "#ff6b6b" : "secondary.main"}
					description={
						isSearching
							? "Cancel current search"
							: "Search for an opponent through random matchmaking."
					}
					disabled={!isConnected}
				/>

				{/* Private Room */}
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
					}}
				>
					<MenuButton
						onClick={handlePlayWithFriendWrapper}
						icon={PlayWithFriendIcon}
						label="PLAY WITH FRIEND"
						backgroundColor="primary.main"
						description="Create a room and invite your friend for a multiplayer match."
					/>

					<Slide direction="up" in={true} mountOnEnter unmountOnExit>
						<TextField
							label="Room Code"
							variant="outlined"
							color="primary"
							fullWidth
							sx={{
								width: "30vh",
								marginBottom: "10px",
								[theme.breakpoints.down("md")]: {
									height: "9vh",
								},
								[theme.breakpoints.down("sm")]: {
									height: "7.2vh",
									width: "45vh",
								},
							}}
							value={enteredRoomCode}
							onChange={(e) =>
								setEnteredRoomCode(e.target.value.toUpperCase())
							}
							onKeyDown={(e) =>
								e.key === "Enter" && handleJoinRoomWrapper()
							}
							InputProps={{
								style: { fontSize: 18 },
								endAdornment: (
									<InputAdornment position="end">
										<IconButton
											sx={{
												color: "#a6a6a6",
												"&:hover, &:focus": {
													color: "primary.main",
												},
											}}
											disabled={
												!isConnected ||
												!enteredRoomCode.trim()
											}
											onClick={handleJoinRoomWrapper}
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
					onClick={handleVersusBotClick}
					icon={VersusBotIcon}
					label="VERSUS BOT"
					backgroundColor="#F49F0A"
					description="Test your skills against an AI opponent."
				/>

				<MenuButton
					onClick={handleSettingsWrapper}
					icon={SettingsIcon}
					label="OPTIONS"
					backgroundColor="#565676"
					description="Adjust board theme, sound settings, and chat preferences."
				/>
			</Box>

			{/* Icon Buttons */}
			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					alignItems: "center",
					marginTop: isMobile ? "0" : "25px",
					position: "relative",
					zIndex: 1,
					overflow: "visible",
				}}
			>
				{iconButtons.map((button, index) => (
					<Slide
						key={index}
						direction="up"
						in={true}
						timeout={{
							enter: 50 + index * 100,
							exit: 300,
						}}
						mountOnEnter
						unmountOnExit
					>
						<Box>
							<Tooltip title={button.title} arrow>
								<IconButton
									disableRipple
									onClick={button.onClick}
									sx={{
										...styles.circleButtonStyle,
									}}
								>
									<button.icon
										sx={{
											color: button.color,
											fontSize: iconSize,
										}}
									/>
								</IconButton>
							</Tooltip>
						</Box>
					</Slide>
				))}
			</Box>

			{/* Modals */}
			<TimeControlModal
				isOpen={isTimeControlModalOpen}
				onClose={handleTimeControlClose}
				onSelectTimeControl={(timeControl) => {
					handleTimeControlClose();
					navigate("/room", {
						state: { selectedTimeControl: timeControl },
					});
				}}
			/>

			<SettingsModal
				isOpen={isSettingsModalOpen}
				onClose={handleCloseSettingsModal}
			/>

			<FAQModal
				isOpen={isFAQModalOpen}
				onClose={() => {
					playClickSound();
					setIsFAQModalOpen(false);
				}}
			/>
		</Box>
	);
};

export default Menu;
