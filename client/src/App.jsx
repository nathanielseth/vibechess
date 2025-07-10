import React, { Suspense, useState, useEffect } from "react";
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CssBaseline from "@mui/material/CssBaseline";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy } from "@loadable/component";
import { ThemeContextProvider } from "./theme/ThemeContextProvider";
import SocketProvider from "./context/SocketProvider";
import { useTheme } from "@mui/material/styles";

const WelcomeScreen = lazy(() => import("./components/menu/WelcomeScreen"));
const Menu = lazy(() => import("./components/menu/Menu"));
const PassAndPlay = lazy(() => import("./components/game/PassAndPlay"));
const Multiplayer = lazy(() => import("./components/game/Multiplayer"));
const Room = lazy(() => import("./components/menu/Room"));
const Loading = lazy(() => import("./components/common/Loading"));

const App = () => {
	const theme = useTheme();
	const storedUsername = window.localStorage.getItem("username");
	const storedFlag = window.localStorage.getItem("selectedFlag");

	const [username, setUsername] = useState(storedUsername);
	const [flag, setFlag] = useState(storedFlag);
	const [usernameSubmitted, setUsernameSubmitted] = useState(
		!!storedUsername
	);

	// Ensure username persistence across sessions
	useEffect(() => {
		if (username && usernameSubmitted) {
			window.localStorage.setItem("username", username);
		}
	}, [username, usernameSubmitted]);

	const setUsernameCallback = (newUsername) => {
		setUsername(newUsername);
		setUsernameSubmitted(true);
		window.localStorage.setItem("username", newUsername);
	};

	const setFlagCallback = (newFlag) => {
		setFlag(newFlag);
		window.localStorage.setItem("selectedFlag", newFlag);
	};

	const handleUsernameSubmit = () => {
		if (username) {
			setUsernameSubmitted(true);
			window.localStorage.setItem("username", username);
		}
	};

	// Handle page visibility for multiplayer connections
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				// Refresh any stale data when user returns to tab
				console.log("🔄 App visible, checking connections...");
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () =>
			document.removeEventListener(
				"visibilitychange",
				handleVisibilityChange
			);
	}, []);

	// Handle online/offline events for multiplayer
	useEffect(() => {
		const handleOnline = () => {
			console.log("🌐 App back online");
		};

		const handleOffline = () => {
			console.log("📡 App offline");
		};

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	return (
		<ThemeContextProvider value={theme}>
			<CssBaseline />
			<SocketProvider>
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
												setFlagCallback={
													setFlagCallback
												}
												onSubmit={handleUsernameSubmit}
											/>
										) : (
											<Menu
												username={username}
												flag={flag}
											/>
										)}
									</>
								}
							/>
							<Route
								path="/pass-and-play"
								element={<PassAndPlay />}
							/>
							<Route
								path="/multiplayer"
								element={<Multiplayer />}
							/>
							<Route path="/room" element={<Room />} />
						</Routes>
					</Suspense>
				</Router>
			</SocketProvider>
			<ToastContainer
				transition={Slide}
				position="top-center"
				autoClose={3000}
				hideProgressBar={false}
				newestOnTop={false}
				closeOnClick
				rtl={false}
				pauseOnFocusLoss
				draggable
				pauseOnHover
				theme="colored"
			/>
		</ThemeContextProvider>
	);
};

export default App;
