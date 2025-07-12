import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export const useMenuNavigation = (playClickSound) => {
	const navigate = useNavigate();

	const handlePassAndPlayClick = useCallback(() => {
		playClickSound();
		navigate("/pass-and-play");
	}, [playClickSound, navigate]);

	const handlePlayWithFriendClick = useCallback(() => {
		playClickSound();
		return true;
	}, [playClickSound]);

	const handleVersusBotClick = useCallback(() => {
		playClickSound();
		navigate("/versus-bot");
	}, [playClickSound, navigate]);

	const handleSettingsClick = useCallback(() => {
		playClickSound();
		return true;
	}, [playClickSound]);

	return {
		handlePassAndPlayClick,
		handlePlayWithFriendClick,
		handleVersusBotClick,
		handleSettingsClick,
	};
};
