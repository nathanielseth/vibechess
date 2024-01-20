import React, { Suspense, useState } from "react";
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CssBaseline from "@mui/material/CssBaseline";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy } from "@loadable/component";
import { ThemeContextProvider } from "./theme/ThemeContextProvider";

const WelcomeScreen = lazy(() => import("./components/menu/WelcomeScreen"));
const Menu = lazy(() => import("./components/menu/Menu"));
const PassAndPlay = lazy(() => import("./components/game/PassAndPlay"));
const Multiplayer = lazy(() => import("./components/game/Multiplayer"));
const Room = lazy(() => import("./components/menu/Room"));
const Loading = lazy(() => import("./components/common/Loading"));

const App = () => {
	const storedUsername = window.localStorage.getItem("username");
	const storedFlag = window.localStorage.getItem("selectedFlag");

	const [username, setUsername] = useState("storedUsername");
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

	return (
		<ThemeContextProvider>
			<CssBaseline />
			<Router>
				<Suspense fallback={<Loading />}>
					<Routes>
						<Route
							path="/"
							element={
								<>
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
								</>
							}
						/>
						<Route
							path="/pass-and-play"
							element={<PassAndPlay />}
						/>
						<Route path="/multiplayer" element={<Multiplayer />} />
						<Route path="/room" element={<Room />} />
					</Routes>
				</Suspense>
			</Router>
			<ToastContainer transition={Slide} />
		</ThemeContextProvider>
	);
};

export default App;
