export const strings1 = [
	"Absurd",
	"Bubbly",
	"Cheeky",
	"Clever",
	"Cool",
	"Crazy",
	"Da",
	"Freakin",
	"Funky",
	"Giga",
	"Happy",
	"King",
	"Mighty",
	"Peculiar",
	"Quirky",
	"Salty",
	"Smart",
	"Sneaky",
	"Silly",
	"Spooky",
	"The",
	"Wacky",
	"Wimp",
	"Wise",
];

export const strings2 = [
	"Banana",
	"Bigfoot",
	"Blunder",
	"Cactus",
	"Cat",
	"Champ",
	"Chief",
	"Coder",
	"Dinosaur",
	"Enigma",
	"Gambit",
	"Guy",
	"Jellyfish",
	"Narwhal",
	"Noodle",
	"Noob",
	"Penguin",
	"Pirate",
	"Potato",
	"Savior",
	"Snail",
	"Unicorn",
	"Vibes",
	"Visionary",
];

const validUsernames = [];
for (const s1 of strings1) {
	for (const s2 of strings2) {
		if (s1.length + s2.length <= 14) {
			validUsernames.push(s1 + s2);
		}
	}
}

export function generateRandomUsername() {
	return validUsernames[Math.floor(Math.random() * validUsernames.length)];
}
