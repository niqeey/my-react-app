import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';

const RaceSetup = () => {
    const { eventId } = useParams();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authFetch('/race/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId })
        })
        .then(res => res.json())
        .then(data => {
            setCategories(data);
            setLoading(false);
        });
    }, [eventId]);

    if (loading) return <div>Loading categories...</div>;

    return (
        <div>
            <h1>Race Categories</h1>
            <ul>
                {categories.map(cat => (
                    <li key={cat.id}>{cat.name}</li>
                ))}
            </ul>
        </div>
    );
};

export default RaceSetup;