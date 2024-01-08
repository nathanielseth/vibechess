import React from "react";
import { Stack, Typography } from "@mui/material";
import Navbar from "../common/Navbar";

const Lobby = () => {
	return (
		<Stack
			direction="column"
			justifyContent="space-between"
			alignItems="center"
			spacing={-10}
			minHeight="100vh"
		>
			<Navbar />

			<Stack
				flexGrow={1}
				px={3}
				spacing={2}
				alignItems="center"
				justifyContent="center"
			>
				<Typography variant="h4" color="white">
					Lobby
				</Typography>
			</Stack>
		</Stack>
	);
};

export default Lobby;
