import React, { Suspense, useState, lazy } from "react";
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Loading from "./components/common/Loading";
import Menu from "./components/menu/Menu";
import PassAndPlay from "./components/menu/PassAndPlay";
import Room from "./components/menu/Room";
import { getTheme } from "./styles/styles";

const WelcomeScreen = lazy(() => import("./components/splash/WelcomeScreen"));

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
					<Route path="/room" element={<Room />} />
				</Routes>
			</Router>
			<ToastContainer transition={Slide} />
		</ThemeProvider>
	);
};

export default App;
