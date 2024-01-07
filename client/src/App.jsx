import React, { Suspense, useState, lazy } from "react";
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Loading from "./components/common/Loading";
import Menu from "./components/menu/Menu";
import PassAndPlay from "./components/game/PassAndPlay";

const WelcomeScreen = lazy(() => import("./components/splash/WelcomeScreen"));

const getTheme = (mode) =>
	createTheme({
		palette: {
			mode: mode,
			primary: {
				main: "#ce1126",
			},
			secondary: {
				main: "#2176ff",
			},
			error: {
				main: "#d264b6",
			},
			warning: {
				main: "#fb8b24",
			},
			info: {
				main: "#4c6663",
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

const App = () => {
	const storedUsername = window.localStorage.getItem("username");
	const storedFlag = window.localStorage.getItem("selectedFlag");

	const [username, setUsername] = useState(storedUsername);
	const [flag, setFlag] = useState(storedFlag || "PH");
	const [usernameSubmitted, setUsernameSubmitted] = useState(
		!!storedUsername
	);

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

	const darkTheme = getTheme("dark");

	return (
		<ThemeProvider theme={darkTheme}>
			<CssBaseline />
			<Router>
				<Routes>
					<Route
						path="/"
						element={
							<Suspense fallback={<Loading />}>
								{!usernameSubmitted || !username ? (
									<WelcomeScreen
										setUsernameCallback={
											setUsernameCallback
										}
										setFlagCallback={setFlagCallback}
										onSubmit={handleUsernameSubmit}
									/>
								) : (
									<Menu username={username} flag={flag} />
								)}
							</Suspense>
						}
					/>
					<Route path="/pass-and-play" element={<PassAndPlay />} />
				</Routes>
			</Router>
			<ToastContainer transition={Slide} />
		</ThemeProvider>
	);
};

export default App;
