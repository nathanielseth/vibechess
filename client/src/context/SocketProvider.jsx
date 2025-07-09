import React from "react";
import PropTypes from "prop-types";
import SocketContext from "./SocketContext";
import useSocket from "../hooks/useSocket";

const SocketProvider = ({ children }) => {
	const socket = useSocket();
	return (
		<SocketContext.Provider value={socket}>
			{children}
		</SocketContext.Provider>
	);
};

SocketProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

export default SocketProvider;
