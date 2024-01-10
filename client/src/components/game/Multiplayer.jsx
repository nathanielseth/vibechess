import React, { useState } from "react";
import Navbar from "../common/Navbar";
import { Stack, Typography } from "@mui/material";
import "react-toastify/dist/ReactToastify.css";
import ChessboardComponent from "./ChessboardComponent";
import { CircleFlag } from "react-circle-flags";

const Multiplayer = () => {
	const [gameMode] = useState("multiplayer");
	const selectedFlag = window.localStorage.getItem("selectedFlag");
	const [username] = useState(
		window.localStorage.getItem("username") || "Guest"
	);

	return (
		<Stack>
			<Navbar title="" />
			<Stack
				minHeight="100vh"
				justifyContent="center"
				alignItems="center"
				height="100vh"
			>
				<Stack flexGrow={1}>
					<Stack
						sx={{ margin: 1 }}
						alignItems="center"
						gap={1}
						direction={{ xs: "column", md: "row" }}
					>
						<CircleFlag countryCode={"es"} height="30" />
						<Typography variant="h5">NeetosCock</Typography>
					</Stack>

					<Stack>
						<ChessboardComponent
							gameMode={gameMode}
							isAnalysisMode={false}
						/>
					</Stack>

					<Stack
						sx={{ margin: 1 }}
						alignItems="center"
						gap={1}
						direction={{ xs: "column", md: "row" }}
					>
						<CircleFlag countryCode={selectedFlag} height="30" />
						<Typography variant="h5">{username}</Typography>
					</Stack>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default Multiplayer;
