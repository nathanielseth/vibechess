import PassNPlayIcon from "../icons/passnplay.svg";
import MatchmakingIcon from "../icons/matchmake.svg";
import PlayWithFriendsIcon from "../icons/friend.svg";
import VersusBotIcon from "../icons/bot.svg";
import SettingsIcon from "../icons/cog.svg";
import VibeChessLogo from "../icons/vibechess.svg";

const styles = {
	circleButtonStyle: {
		backgroundColor: "#fff",
		color: "#000",
		width: "2.8vw",
		height: "2.8vw",
		margin: "8px",
	},
	commonButtonStyles: {
		width: "30vh",
		height: "30.5vh",
		margin: "10px",
		"&:hover": { bgcolor: "white", color: "black" },
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
	},
	passAndPlayContainerStyle: {
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		height: "100vh",
		flexWrap: "wrap",
	},
	boardControlStyle: {
		display: "flex",
		flexDirection: "column",
		flexWrap: "wrap",
		alignItems: "center",
		backgroundColor: "black",
		my: 4,
		marginLeft: "10px",
		bgcolor: "#1f2123",
		border: "2px solid #000",
		height: "50%",
		width: 400,
		overflowY: "auto",
		justifyContent: "center",
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

export {
	PassNPlayIcon,
	MatchmakingIcon,
	PlayWithFriendsIcon,
	VersusBotIcon,
	SettingsIcon,
	VibeChessLogo,
	styles,
};
