import React, { useEffect, useState } from 'react';

const RaceSetup = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch('/api/race-setup')
            .then(res => res.json())
            .then(setData)
            .catch(console.error);
    }, []);

    return (
        <div>
            <h1>Race Setup Page</h1>
            <pre>{data ? JSON.stringify(data, null, 2) : "Loading..."}</pre>
        </div>
    );
};

export default RaceSetup;