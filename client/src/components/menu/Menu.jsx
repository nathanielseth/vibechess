import React, {
	useState,
	useMemo,
	useEffect,
	useContext,
	useCallback,
} from "react";
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
import { toast } from "react-toastify";
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
import useSocketContext from "../../context/useSocketContext";

const Menu = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const { switchColorMode } = useContext(ThemeContext);
	const { socket, isConnected, emit, on } = useSocketContext();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	const [state, setState] = useState({
		isMusicMuted: localStorage.getItem("isMusicMuted") === "true",
		isSettingsModalOpen: false,
		isTimeControlModalOpen: false,
		isRotating: false,
		enteredRoomCode: "",
		isSearching: false,
	});

	const sounds = useMemo(
		() => ({
			music: new Howl({
				src: ["/sound/music.mp3"],
				loop: true,
				volume: 0.5,
			}),
			click: new Howl({
				src: ["/sound/click.mp3"],
				volume: 0.7,
			}),
		}),
		[]
	);

	const updateState = useCallback((updates) => {
		setState((prev) => ({ ...prev, ...updates }));
	}, []);

	const playClickSound = useCallback(
		() => sounds.click.play(),
		[sounds.click]
	);

	const handleImageClick = useCallback(() => {
		updateState({ isRotating: !state.isRotating });
	}, [state.isRotating, updateState]);

	const handlePassAndPlayClick = useCallback(() => {
		playClickSound();
		navigate("/pass-and-play");
	}, [playClickSound, navigate]);

	const handleMatchmakeClick = useCallback(() => {
		if (state.isSearching) {
			emit("cancelMatchmaking");
			updateState({ isSearching: false });
			toast.info("Matchmaking cancelled");
			return;
		}

		if (!socket || !isConnected) {
			toast.error("Not connected to server. Please refresh the page.");
			return;
		}

		const username = localStorage.getItem("username");
		const selectedFlag = localStorage.getItem("selectedFlag");

		if (!username) {
			toast.error("Please set a username first");
			return;
		}

		playClickSound();
		updateState({ isSearching: true });

		toast.info("Searching for opponent...", {
			position: "top-right",
			autoClose: false,
			hideProgressBar: false,
			closeOnClick: false,
			pauseOnHover: false,
			draggable: false,
		});

		emit("findMatch", {
			timeControl: 10,
			playerName: username,
			flag: selectedFlag,
		});
	}, [
		state.isSearching,
		socket,
		isConnected,
		emit,
		playClickSound,
		updateState,
	]);

	const handlePlayWithFriendClick = useCallback(() => {
		playClickSound();
		updateState({ isTimeControlModalOpen: true });
	}, [playClickSound, updateState]);

	const handleTimeControlClose = useCallback(() => {
		playClickSound();
		updateState({ isTimeControlModalOpen: false });
	}, [playClickSound, updateState]);

	const handleSettingsClick = useCallback(() => {
		playClickSound();
		updateState({ isSettingsModalOpen: true });
	}, [playClickSound, updateState]);

	const handleCloseSettingsModal = useCallback(() => {
		playClickSound();
		updateState({ isSettingsModalOpen: false });
	}, [playClickSound, updateState]);

	const handleVersusBotClick = useCallback(() => {
		playClickSound();
		// TODO: Implement bot gameplay
		toast.info("Bot gameplay coming soon!");
	}, [playClickSound]);

	const handleMusicToggle = useCallback(() => {
		if (state.isMusicMuted) {
			sounds.music.play();
		} else {
			sounds.music.stop();
		}
		updateState({ isMusicMuted: !state.isMusicMuted });
	}, [state.isMusicMuted, sounds.music, updateState]);

	const handleJoinRoom = useCallback(() => {
		if (!state.enteredRoomCode.trim()) {
			toast.error("Please enter a room code");
			return;
		}

		if (!socket || !isConnected) {
			toast.error("Not connected to server");
			return;
		}

		const username = localStorage.getItem("username");
		const selectedFlag = localStorage.getItem("selectedFlag");

		playClickSound();
		toast.info("Joining room...");

		emit("joinRoom", {
			roomCode: state.enteredRoomCode.trim(),
			playerName: username,
			flag: selectedFlag,
		});
	}, [state.enteredRoomCode, socket, isConnected, emit, playClickSound]);

	useEffect(() => {
		if (!socket || !isConnected) return;

		const handleMatchFound = (data) => {
			console.log("Match found:", data);
			updateState({ isSearching: false });
			toast.dismiss();
			toast.success("Match found!");

			setTimeout(() => {
				navigate("/multiplayer", { state: data });
			}, 1000);
		};

		const handleQueueJoined = (data) => {
			console.log("Joined queue:", data);
		};

		const handleMatchmakingCancelled = () => {
			updateState({ isSearching: false });
			toast.dismiss();
		};

		const handleConnectionError = () => {
			if (state.isSearching) {
				updateState({ isSearching: false });
				toast.dismiss();
				toast.error("Connection lost. Please try again.");
			}
		};

		const handleRoomJoined = (data) => {
			toast.dismiss();
			toast.success("Joined room successfully!");
			navigate("/multiplayer", { state: data });
		};

		const handleRoomNotFound = () => {
			toast.dismiss();
			toast.error("Room not found. Please check the room code.");
		};

		const handleRoomFull = () => {
			toast.dismiss();
			toast.error("Room is full. Cannot join.");
		};

		const cleanup = [
			on("matchFound", handleMatchFound),
			on("queueJoined", handleQueueJoined),
			on("matchmakingCancelled", handleMatchmakingCancelled),
			on("connect_error", handleConnectionError),
			on("disconnect", handleConnectionError),
			on("gameStarted", handleRoomJoined),
			on("roomNotFound", handleRoomNotFound),
			on("roomFull", handleRoomFull),
		];

		return () => {
			cleanup.forEach((fn) => fn && fn());
		};
	}, [socket, isConnected, on, navigate, updateState, state.isSearching]);

	useEffect(() => {
		if (!isConnected && state.isSearching) {
			updateState({ isSearching: false });
			toast.dismiss();
			toast.error("Lost connection. Please try again.");
		}
	}, [isConnected, state.isSearching, updateState]);

	useEffect(() => {
		if (!state.isMusicMuted) {
			sounds.music.play();
		} else {
			sounds.music.stop();
		}

		localStorage.setItem("isMusicMuted", String(state.isMusicMuted));
		return () => sounds.music.stop();
	}, [state.isMusicMuted, sounds.music]);

	const iconButtons = [
		{
			icon: QuizIcon,
			title: "FAQs",
			color: "#2176ff",
			onClick: () => toast.info("FAQs coming soon!"),
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
			icon: theme.palette.mode === "dark" ? LightModeIcon : DarkModeIcon,
			title: "Toggle UI Mode",
			color: "#1f2123",
			onClick: switchColorMode,
		},
		{
			icon: state.isMusicMuted
				? MusicOffRoundedIcon
				: MusicNoteRoundedIcon,
			title: "Toggle Music",
			color: "#1f2123",
			onClick: handleMusicToggle,
		},
	];

	const rotationStyle = state.isRotating ? rotatingImageRotate : {};
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
					onClick={handleMatchmakeClick}
					icon={MatchmakingIcon}
					label={state.isSearching ? "CANCEL SEARCH" : "MATCHMAKING"}
					backgroundColor={
						state.isSearching ? "#ff6b6b" : "secondary.main"
					}
					description={
						state.isSearching
							? "Cancel current search"
							: "Search for an opponent through random matchmaking."
					}
					disabled={!isConnected}
				/>

				<Box
					sx={{
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

					<Slide direction="up" in={true} mountOnEnter unmountOnExit>
						<TextField
							label="Room Code"
							inputProps={{ style: { fontSize: 18 } }}
							variant="outlined"
							color="primary"
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
							value={state.enteredRoomCode}
							onChange={(e) =>
								updateState({
									enteredRoomCode:
										e.target.value.toUpperCase(),
								})
							}
							onKeyDown={(e) =>
								e.key === "Enter" && handleJoinRoom()
							}
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
											disabled={
												!isConnected ||
												!state.enteredRoomCode.trim()
											}
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
					onClick={handleVersusBotClick}
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
			</Box>

			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					alignItems: "center",
					marginTop: isMobile ? "0" : "25px",
				}}
			>
				{iconButtons.map((button, index) => (
					<Slide
						key={index}
						direction="up"
						in={true}
						style={{ transitionDelay: `${100 + index * 50}ms` }}
						mountOnEnter
						unmountOnExit
					>
						<Tooltip title={button.title} arrow>
							<IconButton
								disableRipple
								onClick={button.onClick}
								style={styles.circleButtonStyle}
							>
								<button.icon
									sx={{
										color: button.color,
										fontSize: iconSize,
									}}
								/>
							</IconButton>
						</Tooltip>
					</Slide>
				))}
			</Box>

			<TimeControlModal
				isOpen={state.isTimeControlModalOpen}
				onClose={handleTimeControlClose}
				onSelectTimeControl={(timeControl) => {
					handleTimeControlClose();
					navigate("/room", {
						state: { selectedTimeControl: timeControl },
					});
				}}
			/>

			<SettingsModal
				isOpen={state.isSettingsModalOpen}
				onClose={handleCloseSettingsModal}
			/>
		</Box>
	);
};

export default Menu;
