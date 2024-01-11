import PassNPlayIcon from "../icons/passnplay.svg";
import MatchmakingIcon from "../icons/matchmake.svg";
import PlayWithFriendIcon from "../icons/friend.svg";
import VersusBotIcon from "../icons/bot.svg";
import SettingsIcon from "../icons/cog.svg";
import VibeChessLogo from "../icons/vibechess.svg";
import { createTheme } from "@mui/material/styles";

const theme = createTheme();

const getTheme = (mode) =>
	createTheme({
		palette: {
			mode: mode,
			primary: {
				main: "#f24040", // red
			},
			secondary: {
				main: "#87BCDE", // blue
			},
			error: {
				main: "#c490d1", // purple
			},
			warning: {
				main: "#f49f0a", // orange
			},
			info: {
				main: "#565676", // indigo
			},
			background: {
				default: mode === "dark" ? "#101010" : "#fff",
			},
		},
		typography: {
			fontFamily: "'IBM Plex Mono', monospace",
			h1: {
				fontFamily: "'Bebas Neue', cursive",
			},
			h2: {
				fontFamily: "'Bebas Neue', cursive",
			},
			h3: {
				fontFamily: "'Bebas Neue', cursive",
			},
			h4: {
				fontFamily: "'Bebas Neue', cursive",
			},
			h5: {
				fontFamily: "'Bebas Neue', cursive",
			},
			h6: {
				fontFamily: "'Bebas Neue', cursive",
			},
		},
	});

const styles = {
	circleButtonStyle: {
		backgroundColor: "#fff",
		color: "#000",
		width: "50px",
		height: "50px",
		margin: "8px",
	},
	commonButtonStyles: {
		width: "30vh",
		height: "75%",
		margin: "10px",
		"&:hover": { bgcolor: "white", color: "black" },
		[theme.breakpoints.down("sm")]: {
			height: "9vh",
			width: "50vh",
		},
	},
	buttonTextStyles: {
		fontSize: "1.6rem",
		marginBottom: "0px",
		textShadow: "1px 1px 2px rgba(0, 0, 0, 0.2)",
	},
	iconStyles: {
		width: "5.3vw",
		height: "auto",
		marginBottom: "25px",
		transition: "filter 0.3s",
		"&:hover": { filter: "brightness(0)" },
		alignItems: "center",
		justifyContent: "center",
	},
	boardControlStyle: {
		display: "flex",
		flexDirection: "column",
		flexWrap: "wrap",
		alignItems: "center",
		backgroundColor: "black",
		bgcolor: "#1f2123",
		border: "2px solid #000",
		height: 300,
		width: 400,
		overflowY: "auto",
		justifyContent: "center",
		borderRadius: 3,
	},
	kingInCheckStyle: {
		background: "radial-gradient(red, rgba(255,0,0,.9), transparent 70%)",
		borderRadius: "30%",
	},
	captureSquareStyle: {
		background:
			"radial-gradient(circle, transparent 60%, rgba(0,0,0,.1) 1%)",
		borderRadius: "50%",
	},
};

const boardThemeColors = {
	grey: {
		darkSquare: "#b6b6b6",
		lightSquare: "#d8d8d8",
	},
	red: {
		darkSquare: "#f24040",
		lightSquare: "#eeeeee",
	},
	blue: {
		darkSquare: "#3f72af",
		lightSquare: "#dbe2ef",
	},
	mud: {
		darkSquare: "#b0a392",
		lightSquare: "#cfc8be",
	},
	orange: {
		darkSquare: "#ff9a00",
		lightSquare: "#f6f7d7",
	},
	green: {
		darkSquare: "#769656",
		lightSquare: "#eeeed2",
	},
	lavander: {
		darkSquare: "#c0acb5",
		lightSquare: "#e5d0cb",
	},
};

export const rotatingImageStyle = {
	width: "110px",
	height: "auto",
	marginBottom: "10px",
	transition: "transform 0.6s ease-in-out",
	cursor: "pointer",
};

export const rotatingImageRotate = {
	transform: "rotate(360deg)",
};

export {
	PassNPlayIcon,
	MatchmakingIcon,
	PlayWithFriendIcon,
	VersusBotIcon,
	SettingsIcon,
	VibeChessLogo,
	styles,
	boardThemeColors,
	getTheme,
};
