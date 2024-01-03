import React, { useState, useEffect } from "react";
import Loading from "./components/Loading";
import Menu from "./components/Menu";

function App() {
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setLoading(false);
		}, 3000);
		return () => clearTimeout(timeoutId);
	}, []);

	return loading ? <Loading /> : <Menu />;
}

export default App;
