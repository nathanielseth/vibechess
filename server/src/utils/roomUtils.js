export const generateRoomCode = () => {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	return Array.from(
		{ length: 6 },
		() => chars[Math.floor(Math.random() * chars.length)]
	).join("");
};

export const validateRoomCode = (roomCode) => {
	return typeof roomCode === "string" && /^[A-Z0-9]{6}$/.test(roomCode);
};

export const validateTimeControl = (timeControl) => {
	return (
		typeof timeControl === "number" && timeControl > 0 && timeControl <= 180
	);
};

export const validatePlayerName = (playerName) => {
	return (
		typeof playerName === "string" &&
		playerName.trim().length > 0 &&
		playerName.length <= 20
	);
};

export const validateColor = (color) => {
	return color === "white" || color === "black";
};

export const normalizeFlag = (flag) => {
	return flag?.toLowerCase() || null;
};
