import { useMemo, useCallback, useState, useEffect } from "react";
import { Howl } from "howler";

export const useMenuSounds = () => {
	const [isMusicMuted, setIsMusicMuted] = useState(true);

	const sounds = useMemo(
		() => ({
			music: new Howl({
				src: ["/sound/music.mp3"],
				loop: true,
				volume: 0.5,
			}),
			click: new Howl({
				src: ["/sound/click.mp3"],
				volume: 0.7,
			}),
		}),
		[]
	);

	const playClickSound = useCallback(() => {
		sounds.click.play();
	}, [sounds.click]);

	const handleMusicToggle = useCallback(() => {
		const newMutedState = !isMusicMuted;

		if (newMutedState) {
			sounds.music.stop();
		} else {
			sounds.music.play();
		}

		setIsMusicMuted(newMutedState);
		localStorage.setItem("isMusicMuted", String(newMutedState));
	}, [isMusicMuted, sounds.music]);

	useEffect(() => {
		const savedMusicState = localStorage.getItem("isMusicMuted");
		if (savedMusicState !== null) {
			const isMuted = savedMusicState === "true";
			setIsMusicMuted(isMuted);
		}

		return () => {
			sounds.music.stop();
		};
	}, [sounds.music]);

	return {
		isMusicMuted,
		playClickSound,
		handleMusicToggle,
	};
};
