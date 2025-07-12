import React, { useEffect, useState } from 'react';
import apiBase from '../apiBase';

const EventSetup = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        // Replace with your microservice endpoint
        fetch(`${apiBase}/api/event-setup`)
            .then(res => res.json())
            .then(setData)
            .catch(console.error);
    }, []);

    return (
        <div>
            <h1>Event Setup Page</h1>
            <pre>{data ? JSON.stringify(data, null, 2) : "Loading..."}</pre>
        </div>
    );
};

export default EventSetup;