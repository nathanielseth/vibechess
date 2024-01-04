import React, { Suspense, useState, lazy } from "react";
import Loading from "./components/Loading";
import Menu from "./components/Menu";
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const WelcomeScreen = lazy(() => import("./components/WelcomeScreen"));

const darkTheme = createTheme({
	palette: {
		mode: "dark",
	},
});

const App = () => {
	const storedUsername = window.localStorage.getItem("username");
	const storedFlag = window.localStorage.getItem("selectedFlag");

	const [username, setUsername] = useState(storedUsername);
	const [flag, setFlag] = useState(storedFlag || "PH");
	const [usernameSubmitted, setUsernameSubmitted] = useState(false);

	const setUsernameCallback = (newUsername) => {
		setUsername(newUsername);
		setUsernameSubmitted(true);
	};

	const setFlagCallback = (newFlag) => {
		setFlag(newFlag);
		window.localStorage.setItem("selectedFlag", newFlag);
	};

	const handleUsernameSubmit = () => {
		setUsernameSubmitted(true);
	};

	return (
		<ThemeProvider theme={darkTheme}>
			<CssBaseline />
			<>
				<Suspense fallback={<Loading />}>
					{!usernameSubmitted || !username ? (
						<WelcomeScreen
							setUsernameCallback={setUsernameCallback}
							setFlagCallback={setFlagCallback}
							onSubmit={handleUsernameSubmit}
						/>
					) : (
						<Menu username={username} flag={flag} />
					)}
				</Suspense>
				<ToastContainer transition={Slide} />
			</>
		</ThemeProvider>
	);
};

export default App;
