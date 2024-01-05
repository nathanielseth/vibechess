import React, { useState } from "react";
import PropTypes from "prop-types";
import {
	Modal,
	Fade,
	Box,
	Typography,
	TextField,
	Button,
	Tooltip,
} from "@mui/material";
import { CircleFlag } from "react-circle-flags";
import "../styles/scrollbar.css";

const FlagSelectorModal = ({ open, onClose, onSelect }) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredFlags, setFilteredFlags] = useState([]);
	const [selectedFlag, setSelectedFlag] = useState("ph");

	const flagData = {
		ph: "Philippines",
		us: "United States",
		in: "India",
		ua: "Ukraine",
		fr: "France",
		gb: "United Kingdom",
		az: "Azerbaijan",
		de: "Germany",
		es: "Spain",
		ac: "Ascension Island",
		ad: "Andorra",
		ae: "United Arab Emirates",
		af: "Afghanistan",
		ag: "Antigua and Barbuda",
		ai: "Anguilla",
		al: "Albania",
		am: "Armenia",
		ao: "Angola",
		aq: "Antarctica",
		ar: "Argentina",
		as: "American Samoa",
		at: "Austria",
		au: "Australia",
		"au-aboriginal": "Australian Aboriginal Flag",
		"au-act": "Australian Capital Territory",
		"au-nt": "Northern Territory",
		"au-qld": "Queensland",
		"au-tas": "Tasmania",
		"au-vic": "Victoria",
		"au-wa": "Western Australia",
		aw: "Aruba",
		ax: "Åland Islands",
		ba: "Bosnia and Herzegovina",
		bb: "Barbados",
		bd: "Bangladesh",
		be: "Belgium",
		bf: "Burkina Faso",
		bg: "Bulgaria",
		bh: "Bahrain",
		bi: "Burundi",
		bj: "Benin",
		bl: "Saint Barthélemy",
		bm: "Bermuda",
		bn: "Brunei",
		bo: "Bolivia",
		"bq-bo": "Bonaire, Sint Eustatius, and Saba",
		"bq-sa": "Saba",
		"bq-se": "Sint Eustatius",
		bq: "Caribbean Netherlands",
		br: "Brazil",
		bs: "The Bahamas",
		bt: "Bhutan",
		bv: "Bouvet Island",
		bw: "Botswana",
		by: "Belarus",
		bz: "Belize",
		"ca-bc": "British Columbia",
		ca: "Canada",
		cc: "Cocos (Keeling) Islands",
		cd: "Democratic Republic of the Congo",
		cf: "Central African Republic",
		cg: "Republic of the Congo",
		ch: "Switzerland",
		"ch-gr": "Grisons",
		ci: "Ivory Coast",
		ck: "Cook Islands",
		cl: "Chile",
		cm: "Cameroon",
		cn: "China",
		"cn-xj": "Xinjiang",
		co: "Colombia",
		cp: "Clipperton Island",
		cq: "Corsica",
		cr: "Costa Rica",
		cu: "Cuba",
		cv: "Cape Verde",
		cw: "Curaçao",
		cx: "Christmas Island",
		cy: "Cyprus",
		cz: "Czech Republic",
		dj: "Djibouti",
		dk: "Denmark",
		dm: "Dominica",
		dg: "Diego Garcia",
		do: "Dominican Republic",
		dz: "Algeria",
		ea: "Ceuta and Melilla",
		earth: "Earth",
		east_african_federation: "East African Federation",
		easter_island: "Easter Island",
		"ec-w": "Galápagos",
		ec: "Ecuador",
		ee: "Estonia",
		eg: "Egypt",
		eh: "Western Sahara",
		er: "Eritrea",
		"es-ar": "Aragon",
		"es-ce": "Ceuta",
		"es-cn": "Canary Islands",
		"es-ct": "Catalonia",
		"es-ga": "Galicia",
		"es-ib": "Balearic Islands",
		"es-ml": "Melilla",
		"es-pv": "Basque Country",
		"es-variant": "Spain Variant",
		et: "Ethiopia",
		"et-or": "Oromia",
		"et-ti": "Tigray",
		eu: "European Union",
		european_union: "European Union",
		ewe: "Ewe",
		fi: "Finland",
		fj: "Fiji",
		fk: "Falkland Islands",
		fm: "Federated States of Micronesia",
		fo: "Faroe Islands",
		"fr-20r": "Réunion",
		"fr-bre": "Brittany",
		"fr-cp": "Saint Pierre and Miquelon",
		fx: "Metropolitan France",
		ga: "Gabon",
		"gb-con": "City of London",
		"gb-eng": "England",
		"gb-nir": "Northern Ireland",
		"gb-ork": "Orkney",
		"gb-sct": "Scotland",
		"gb-wls": "Wales",
		gd: "Grenada",
		"ge-ab": "Abkhazia",
		ge: "Georgia",
		gf: "French Guiana",
		gg: "Guernsey",
		gh: "Ghana",
		gi: "Gibraltar",
		gl: "Greenland",
		gm: "The Gambia",
		gn: "Guinea",
		gp: "Guadeloupe",
		gq: "Equatorial Guinea",
		gr: "Greece",
		gs: "South Georgia and the South Sandwich Islands",
		gt: "Guatemala",
		guarani: "Guaraní",
		gu: "Guam",
		gw: "Guinea-Bissau",
		gy: "Guyana",
		hausa: "Hausa",
		hk: "Hong Kong",
		hmong: "Hmong",
		hm: "Heard Island and McDonald Islands",
		hn: "Honduras",
		hr: "Croatia",
		ht: "Haiti",
		hu: "Hungary",
		ic: "Canary Islands",
		id: "Indonesia",
		"id-jb": "West Java",
		"id-jt": "Central Java",
		ie: "Ireland",
		il: "Israel",
		im: "Isle of Man",
		"in-as": "Assam",
		"in-gj": "Gujarat",
		"in-ka": "Karnataka",
		"in-or": "Odisha",
		"in-tn": "Tamil Nadu",
		io: "British Indian Ocean Territory",
		iq: "Iraq",
		ir: "Iran",
		is: "Iceland",
		"it-23": "Veneto",
		"it-82": "Sicily",
		"it-88": "Aosta Valley",
		it: "Italy",
		je: "Jersey",
		jm: "Jamaica",
		jo: "Jordan",
		jp: "Japan",
		kanuri: "Kanuri",
		ke: "Kenya",
		kg: "Kyrgyzstan",
		kh: "Cambodia",
		ki: "Kiribati",
		kikuyu: "Kikuyu",
		km: "Comoros",
		kn: "Saint Kitts and Nevis",
		kongo: "Kongo",
		kp: "North Korea",
		kr: "South Korea",
		kurdistan: "Kurdistan",
		kw: "Kuwait",
		ky: "Cayman Islands",
		kz: "Kazakhstan",
		la: "Laos",
		lb: "Lebanon",
		lc: "Saint Lucia",
		li: "Liechtenstein",
		lk: "Sri Lanka",
		lr: "Liberia",
		ls: "Lesotho",
		lt: "Lithuania",
		lu: "Luxembourg",
		lv: "Latvia",
		ly: "Libya",
		ma: "Morocco",
		malayali: "Malayali",
		manipur: "Manipur",
		maori: "Māori",
		mc: "Monaco",
		md: "Moldova",
		me: "Montenegro",
		mf: "Saint Martin",
		mg: "Madagascar",
		mh: "Marshall Islands",
		mizoram: "Mizoram",
		mk: "North Macedonia",
		ml: "Mali",
		mm: "Myanmar",
		mn: "Mongolia",
		mo: "Macau",
		mp: "Northern Mariana Islands",
		mq: "Martinique",
		mr: "Mauritania",
		ms: "Montserrat",
		mt: "Malta",
		mu: "Mauritius",
		mv: "Maldives",
		mw: "Malawi",
		mx: "Mexico",
		my: "Malaysia",
		mz: "Mozambique",
		na: "Namibia",
		nc: "New Caledonia",
		nato: "NATO",
		ne: "Niger",
		nf: "Norfolk Island",
		ng: "Nigeria",
		ni: "Nicaragua",
		nl: "Netherlands",
		"nl-fr": "Friesland",
		no: "Norway",
		northern_cyprus: "Northern Cyprus",
		np: "Nepal",
		nr: "Nauru",
		nu: "Niue",
		nz: "New Zealand",
		occitania: "Occitania",
		olympics: "Olympics",
		om: "Oman",
		otomi: "Otomi",
		pa: "Panama",
		pe: "Peru",
		pf: "French Polynesia",
		pg: "Papua New Guinea",
		pk: "Pakistan",
		"pk-jk": "Jammu and Kashmir",
		"pk-sd": "Sindh",
		pl: "Poland",
		pm: "Saint Pierre and Miquelon",
		pn: "Pitcairn Islands",
		pr: "Puerto Rico",
		ps: "State of Palestine",
		"pt-20": "Azores",
		"pt-30": "Madeira",
		pt: "Portugal",
		pw: "Palau",
		py: "Paraguay",
		qa: "Qatar",
		quechua: "Quechua",
		re: "Réunion",
		ro: "Romania",
		rs: "Serbia",
		ru: "Russia",
		"ru-ba": "Bashkortostan",
		"ru-ce": "Chechnya",
		"ru-cu": "Chuvashia",
		"ru-da": "Dagestan",
		"ru-ko": "Komi",
		"ru-ta": "Tatarstan",
		"ru-ud": "Udmurtia",
		rw: "Rwanda",
		sa: "Saudi Arabia",
		sami: "Sámi",
		sb: "Solomon Islands",
		sc: "Seychelles",
		sd: "Sudan",
		se: "Sweden",
		sg: "Singapore",
		sh: "Saint Helena",
		"sh-hl": "Saint Helena, Ascension and Tristan da Cunha",
		"sh-ac": "Ascension Island",
		"sh-ta": "Tristan da Cunha",
		si: "Slovenia",
		sj: "Svalbard and Jan Mayen",
		sk: "Slovakia",
		sl: "Sierra Leone",
		sm: "San Marino",
		sn: "Senegal",
		so: "Somalia",
		somaliland: "Somaliland",
		south_ossetia: "South Ossetia",
		soviet_union: "Soviet Union",
		sr: "Suriname",
		ss: "South Sudan",
		st: "São Tomé and Príncipe",
		su: "Soviet Union",
		sv: "El Salvador",
		sx: "Sint Maarten",
		sy: "Syria",
		sz: "Eswatini",
		ta: "Tamil Eelam",
		tc: "Turks and Caicos Islands",
		td: "Chad",
		tf: "French Southern and Antarctic Lands",
		tg: "Togo",
		th: "Thailand",
		tibet: "Tibet",
		tj: "Tajikistan",
		tk: "Tokelau",
		tl: "East Timor",
		tm: "Turkmenistan",
		tn: "Tunisia",
		to: "Tonga",
		tr: "Turkey",
		transnistria: "Transnistria",
		tt: "Trinidad and Tobago",
		tv: "Tuvalu",
		tw: "Taiwan",
		tz: "Tanzania",
		ug: "Uganda",
		uk: "United Kingdom",
		"us-hi": "Hawaii",
		uy: "Uruguay",
		uz: "Uzbekistan",
		va: "Vatican City",
		vc: "Saint Vincent and the Grenadines",
		ve: "Venezuela",
		vg: "British Virgin Islands",
		vi: "United States Virgin Islands",
		vn: "Vietnam",
		vu: "Vanuatu",
		wf: "Wallis and Futuna",
		wiphala: "Wiphala",
		ws: "Samoa",
		xk: "Kosovo",
		ye: "Yemen",
		yt: "Mayotte",
		yorubaland: "Yorubaland",
		za: "South Africa",
		zm: "Zambia",
		zw: "Zimbabwe",
	};

	const columns = 9;
	const rows = [];
	for (let i = 0; i < filteredFlags.length; i += columns) {
		const rowFlags = filteredFlags.slice(i, i + columns);
		rows.push(rowFlags);
	}

	useState(() => {
		setFilteredFlags(Object.keys(flagData));
	}, []);

	const handleSearchChange = (event) => {
		const term = event.target.value.toLowerCase();
		setSearchTerm(term);

		const filtered = Object.keys(flagData).filter((countryCode) =>
			flagData[countryCode].toLowerCase().includes(term)
		);
		setFilteredFlags(filtered);
	};

	const handleFlagSelect = (countryCode) => {
		setSelectedFlag(countryCode);
	};

	const handleOK = () => {
		onSelect(selectedFlag);
		onClose();
	};

	return (
		<Modal open={open} onClose={onClose} closeAfterTransition>
			<Fade in={open}>
				<Box
					sx={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						width: 800,
						bgcolor: "#1f2123",
						border: "2px solid #000",
						boxShadow: 24,
						p: 4,
					}}
				>
					<Typography variant="h6" mb={2}>
						CHOOSE YOUR FLAG
					</Typography>

					<TextField
						label="Search for a flag"
						variant="outlined"
						fullWidth
						mb={2}
						value={searchTerm}
						onChange={handleSearchChange}
					/>

					<Box
						sx={{
							maxHeight: "380px",
							overflowY: "auto",
							mb: 4,
							mt: 3,
							display: "flex",
							flexDirection: "row",
							flexWrap: "wrap",
							justifyContent: "center",
							alignItems: "center",
							gap: "10px 5px",
						}}
					>
						{rows.map((row, rowIndex) => (
							<React.Fragment key={rowIndex}>
								{row.map((countryCode) => (
									<Tooltip key={countryCode} title={flagData[countryCode]}>
										<Button
											onClick={() => handleFlagSelect(countryCode)}
											sx={{
												mb: 1,
												padding: 3,
												backgroundColor: "transparent",
												border:
													selectedFlag === countryCode
														? "3px solid #ce1126"
														: "none",
												width: "74px",
												height: "74px",
												boxSizing: "border-box",
											}}
										>
											<CircleFlag countryCode={countryCode} height="55" />
										</Button>
									</Tooltip>
								))}
							</React.Fragment>
						))}
					</Box>

					<Box display="flex" justifyContent="flex-end">
						<Button
							variant="text"
							mr={1}
							onClick={onClose}
							style={{ color: "white" }}
						>
							CANCEL
						</Button>
						<Box mr={1} />
						<Button
							variant="contained"
							style={{ backgroundColor: "#ce1126", color: "white" }}
							onClick={handleOK}
						>
							CONFIRM
						</Button>
					</Box>
				</Box>
			</Fade>
		</Modal>
	);
};

FlagSelectorModal.propTypes = {
	open: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	onSelect: PropTypes.func.isRequired,
};

export default FlagSelectorModal;
