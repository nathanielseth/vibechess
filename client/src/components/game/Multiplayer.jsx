import React, { useState, useEffect } from "react";
import Navbar from "../common/Navbar";
import { Stack } from "@mui/material";
import "react-toastify/dist/ReactToastify.css";
import ChessboardComponent from "./ChessboardComponent";
import { notifySound } from "../../data/utils";

const Multiplayer = () => {
	const [gameMode] = useState("multiplayer");

	useEffect(() => {
		notifySound.play();

		return () => notifySound.stop();
	}, []);

	return (
		<Stack>
			<Navbar gameMode={gameMode} />
			<Stack
				minHeight="100dvh"
				justifyContent="center"
				alignItems="center"
				height={{ xs: "100dvh", md: "300dvh" }}
				sx={{
					zIndex: 1,
					overflowY: { xs: "auto", sm: "auto", md: "hidden" },
					overflowX: { xs: "auto", sm: "auto", md: "hidden" },
					maxHeight: "100dvh",
				}}
			>
				<Stack flexGrow={1}>
					<Stack>
						<ChessboardComponent
							gameMode={gameMode}
							isAnalysisMode={false}
						/>
					</Stack>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default Multiplayer;
