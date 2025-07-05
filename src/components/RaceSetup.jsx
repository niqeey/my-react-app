import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';

const cardStyle = {
    border: '1px solid #e0e0e0',
    borderRadius: '10px',
    padding: '18px 24px',
    margin: '18px 0',
    background: '#fafbfc',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    transition: 'box-shadow 0.2s',
};

const containerStyle = {
    minHeight: 'calc(100vh - 80px)',
    paddingBottom: 100,
    maxWidth: 700,
    margin: '0 auto'
};

const cpOptions = Array.from({length: 10}, (_, i) => `TimeCP${i+1}`);

const RaceSetup = () => {
    const { eventId } = useParams();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newCat, setNewCat] = useState({
        name: '',
        cat: '',
        distance: 10,
        gender: 'M',
        raceMode: 'OFFICIAL',
        toplist: 10,
        isresult: 1
    });
    const [cpList, setCpList] = useState(Array(10).fill(''));
    const [editingCp, setEditingCp] = useState({}); // { [catId]: [cp1, cp2, ...] }

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
        })
        .catch(err => {
            setLoading(false);
        });
    }, [eventId]);

    const handleNewCatChange = e => {
        const { name, value, type, checked } = e.target;
        setNewCat(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        }));
    };

    // For editing CP List inline
    const handleEditCpChange = (catId, idx, value) => {
        setEditingCp(prev => {
            const next = { ...prev };
            const cpArr = next[catId] ? [...next[catId]] : Array(10).fill('');
            cpArr[idx] = value;
            next[catId] = cpArr;
            return next;
        });
    };

    const startEditCp = (catId, checkpointlist) => {
        setEditingCp(prev => ({
            ...prev,
            [catId]: (checkpointlist || '').split(',').concat(Array(10).fill('')).slice(0, 10)
        }));
    };

    const cancelEditCp = (catId) => {
        setEditingCp(prev => {
            const next = { ...prev };
            delete next[catId];
            return next;
        });
    };

    const saveEditCp = async (cat) => {
        const cpArr = editingCp[cat.catId] || [];
        const checkpointlist = cpArr.filter(Boolean).join(',');
        try {
            await authFetch('/race/category/update-cplist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId, catId: cat.catId, checkpointlist })
            });
            // Refresh categories
            const res = await authFetch('/race/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId })
            });
            const data = await res.json();
            setCategories(data);
            cancelEditCp(cat.catId);
        } catch (err) {
            alert('Failed to update CP List');
        }
    };

    const handleCpChange = (idx, value) => {
        setCpList(prev => {
            const next = [...prev];
            next[idx] = value;
            return next;
        });
    };

    if (loading) return <div>Loading categories...</div>;

    // Get event name from the first category (if available)
    const eventName = categories.length > 0 ? categories[0].eventName : '';

    // Helper to get available cat options
    const allCatOptions = Array.from({length: 25}, (_, i) => String.fromCharCode(65 + i)); // A-Y
    const usedCats = categories.map(c => c.cat);
    const availableCats = allCatOptions.filter(c => !usedCats.includes(c));

    return (
        <div style={containerStyle}>
            <h1 style={{ marginBottom: 24 }}>{eventName}</h1>
            <h2 style={{ marginBottom: 16, fontSize: '1.2rem', color: '#444' }}>Categories</h2>
            <div>
                {categories.map(cat => {
                    const isEditing = !!editingCp[cat.catId];
                    return (
                        <div key={cat.catId} style={cardStyle}>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 6 }}>
                                {cat.cat}: {cat.name}
                            </div>
                            <div style={{ marginBottom: 8 }}>
                                {isEditing ? (
                                    <>
                                        <label>
                                            Distance:&nbsp;
                                            <select
                                                value={editingCp[cat.catId + '_distance'] ?? cat.distance}
                                                onChange={e =>
                                                    setEditingCp(prev => ({ ...prev, [cat.catId + '_distance']: e.target.value }))
                                                }
                                            >
                                                {[3,5,10,15,21,42].map(d => (
                                                    <option key={d} value={d}>{d}KM</option>
                                                ))}
                                            </select>
                                        </label>
                                        &nbsp;|&nbsp;
                                        <label>
                                            Gender:&nbsp;
                                            <select
                                                value={editingCp[cat.catId + '_gender'] ?? cat.gender}
                                                onChange={e =>
                                                    setEditingCp(prev => ({ ...prev, [cat.catId + '_gender']: e.target.value }))
                                                }
                                            >
                                                <option value="M">Men</option>
                                                <option value="F">Women</option>
                                            </select>
                                        </label>
                                        &nbsp;|&nbsp;
                                        <label>
                                            Mode:&nbsp;
                                            <select
                                                value={editingCp[cat.catId + '_raceMode'] ?? cat.raceMode}
                                                onChange={e =>
                                                    setEditingCp(prev => ({ ...prev, [cat.catId + '_raceMode']: e.target.value }))
                                                }
                                            >
                                                <option value="NET">NET</option>
                                                <option value="OFFICIAL">OFFICIAL</option>
                                            </select>
                                        </label>
                                        &nbsp;|&nbsp;
                                        <label>
                                            Top:&nbsp;
                                            <input
                                                type="number"
                                                min={1}
                                                max={100}
                                                value={editingCp[cat.catId + '_toplist'] ?? cat.toplist}
                                                onChange={e =>
                                                    setEditingCp(prev => ({ ...prev, [cat.catId + '_toplist']: e.target.value }))
                                                }
                                                style={{ width: 60 }}
                                            />
                                        </label>
                                        &nbsp;|&nbsp;
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={(editingCp[cat.catId + '_isresult'] ?? cat.isresult) === 1}
                                                onChange={e =>
                                                    setEditingCp(prev => ({
                                                        ...prev,
                                                        [cat.catId + '_isresult']: e.target.checked ? 1 : 0
                                                    }))
                                                }
                                            />
                                            &nbsp;Report
                                        </label>
                                    </>
                                ) : (
                                    <>
                                        <span style={{display: 'inline-block', minWidth: 150}}>
                                            Distance: {cat.distance}KM
                                        </span>
                                        <span style={{display: 'inline-block', minWidth: 150}}>
                                            Gender: {cat.gender === 'M' ? "Men" : "Women"}
                                        </span>
                                        <span style={{display: 'inline-block', minWidth: 170}}>
                                            Mode: {cat.raceMode}
                                        </span>
                                        <span style={{display: 'inline-block', minWidth: 80}}>
                                            Top: {cat.toplist}
                                        </span>
                                        <span style={{display: 'inline-block', minWidth: 70}}>
                                            Report: {cat.isresult === 1 ? 'Yes' : 'No'}
                                        </span>
                                    </>
                                )}
                            </div>
                            <div style={{marginBottom: 8}}>
                                <div style={{fontWeight: 600, marginBottom: 4}}>CP List:</div>
                                {isEditing ? (
                                    <div>
                                        <div style={{display:'flex', flexWrap:'wrap', gap:8, marginBottom:8}}>
                                            {editingCp[cat.catId].map((cp, idx) => (
                                                <select
                                                    key={idx}
                                                    value={cp}
                                                    onChange={e => handleEditCpChange(cat.catId, idx, e.target.value)}
                                                    style={{marginBottom:4}}
                                                >
                                                    <option value="">-</option>
                                                    {cpOptions.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ))}
                                        </div>
                                        <button
                                            onClick={async () => {
                                                // Save all fields
                                                const cpArr = editingCp[cat.catId] || [];
                                                const checkpointlist = cpArr.filter(Boolean).join(',');
                                                const distance = editingCp[cat.catId + '_distance'] ?? cat.distance;
                                                const gender = editingCp[cat.catId + '_gender'] ?? cat.gender;
                                                const raceMode = editingCp[cat.catId + '_raceMode'] ?? cat.raceMode;
                                                const toplist = editingCp[cat.catId + '_toplist'] ?? cat.toplist;
                                                const isresult = editingCp[cat.catId + '_isresult'] ?? cat.isresult;
                                                try {
                                                    await authFetch('/race/category/update', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            eventId,
                                                            catId: cat.catId,
                                                            checkpointlist,
                                                            distance,
                                                            gender,
                                                            raceMode,
                                                            toplist,
                                                            isresult
                                                        })
                                                    });
                                                    // Refresh categories
                                                    const res = await authFetch('/race/categories', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ eventId })
                                                    });
                                                    const data = await res.json();
                                                    setCategories(data);
                                                    cancelEditCp(cat.catId);
                                                } catch (err) {
                                                    alert('Failed to update category');
                                                }
                                            }}
                                            style={{
                                                background: '#1976d2',
                                                color: '#fff',
                                                border: 'none',
                                                padding: '8px 18px',
                                                borderRadius: 5,
                                                cursor: 'pointer',
                                                marginRight: 8
                                            }}
                                        >Save</button>
                                        <button
                                            onClick={() => cancelEditCp(cat.catId)}
                                            style={{
                                                background: '#fff',
                                                color: '#1976d2',
                                                border: '1px solid #1976d2',
                                                padding: '8px 18px',
                                                borderRadius: 5,
                                                cursor: 'pointer'
                                            }}
                                        >Cancel</button>
                                    </div>
                                ) : (
                                    <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end', minHeight: 40}}>
                                        <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, flex: 1}}>
                                            {(cat.checkpointlist || '').split(',').filter(Boolean).map(cp => (
                                                <span
                                                    key={cp}
                                                    style={{
                                                        background: '#e3f2fd',
                                                        color: '#1976d2',
                                                        borderRadius: 4,
                                                        padding: '2px 10px',
                                                        fontSize: '0.97em',
                                                        marginBottom: 4
                                                    }}
                                                >
                                                    {cp}
                                                </span>
                                            ))}
                                            {(!cat.checkpointlist || cat.checkpointlist === '') && (
                                                <span style={{color:'#aaa'}}>No CP</span>
                                            )}
                                        </div>
                                        <div style={{marginLeft: 'auto'}}>
                                            <button
                                                onClick={() => startEditCp(cat.catId, cat.checkpointlist)}
                                                style={{
                                                    background: '#fff',
                                                    color: '#1976d2',
                                                    border: '1px solid #1976d2',
                                                    padding: '6px 16px',
                                                    borderRadius: 5,
                                                    cursor: 'pointer',
                                                    marginLeft: 12,
                                                    minWidth: 70
                                                }}
                                            >Edit</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div style={{ textAlign: 'center', marginTop: 32 }}>
                <button
                    style={{
                        padding: '10px 28px',
                        fontSize: '1rem',
                        borderRadius: 6,
                        border: '1px solid #1976d2',
                        background: '#1976d2',
                        color: '#fff',
                        cursor: 'pointer'
                    }}
                    onClick={() => setShowModal(true)}
                >
                    + Add Category
                </button>
            </div>

            {showModal && (
    <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
        <div style={{
            background: '#fff', padding: 32, borderRadius: 10, minWidth: 320, boxShadow: '0 4px 24px rgba(0,0,0,0.15)'
        }}>
            <h2 style={{marginTop:0}}>Add Category</h2>
            <div style={{marginBottom:12}}>
                <label>
                    Cat:&nbsp;
                    <select name="cat" value={newCat.cat || ''} onChange={handleNewCatChange}>
                        <option value="">Select</option>
                        {availableCats.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </label>
                &nbsp;|&nbsp;
                <label>
                    Name:&nbsp;
                    <input name="name" value={newCat.name} onChange={handleNewCatChange} style={{width:200}} />
                </label>
            </div>
            <div style={{marginBottom:12}}>
                <label>
                    Distance:&nbsp;
                    <select name="distance" value={newCat.distance} onChange={handleNewCatChange}>
                        {[3,5,10,15,21,42].map(d => (
                            <option key={d} value={d}>{d}KM</option>
                        ))}
                    </select>
                </label>
                &nbsp;|&nbsp;
                <label>
                    Gender:&nbsp;
                    <select name="gender" value={newCat.gender} onChange={handleNewCatChange}>
                        <option value="M">Men</option>
                        <option value="F">Women</option>
                    </select>
                </label>
            </div>
            <div style={{marginBottom:12}}>
                <label>
                    Mode:&nbsp;
                    <select name="raceMode" value={newCat.raceMode} onChange={handleNewCatChange}>
                        <option value="NET">NET</option>
                        <option value="OFFICIAL">OFFICIAL</option>
                    </select>
                </label>
                &nbsp;|&nbsp;
                <label>
                    Top:&nbsp;
                    <input
                        name="toplist"
                        type="number"
                        min={1}
                        max={100}
                        value={newCat.toplist}
                        onChange={handleNewCatChange}
                        style={{ width: 60 }}
                    />
                </label>
                &nbsp;|&nbsp;
                <label>
                    <input
                        name="isresult"
                        type="checkbox"
                        checked={newCat.isresult === 1}
                        onChange={handleNewCatChange}
                    />
                    &nbsp;Report
                </label>
            </div>
            <div style={{marginBottom:12}}>
                <div style={{marginBottom:4, fontWeight:600}}>CP List:</div>
                <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                    {cpList.map((cp, idx) => (
                        <select
                            key={idx}
                            value={cp}
                            onChange={e => handleCpChange(idx, e.target.value)}
                            style={{marginBottom:4}}
                        >
                            <option value="">-</option>
                            {cpOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    ))}
                </div>
            </div>
            <div style={{textAlign:'right'}}>
                <button onClick={() => setShowModal(false)} style={{marginRight:12}}>Cancel</button>
                <button
                    style={{background:'#1976d2',color:'#fff',border:'none',padding:'8px 18px',borderRadius:5,cursor:'pointer'}}
                    onClick={async () => {
                        try {
                            // Combine selected CPs in order, skip blanks
                            const checkpointlist = cpList.filter(Boolean).join(',');
                            await authFetch('/race/category/create', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ eventId, ...newCat, checkpointlist })
                            });
                            setShowModal(false);
                            // Refresh categories
                            const res = await authFetch('/race/categories', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ eventId })
                            });
                            const data = await res.json();
                            setCategories(data);
                            // Reset form
                            setNewCat({
                                name: '',
                                cat: '',
                                distance: 10,
                                gender: 'M',
                                raceMode: 'OFFICIAL',
                                toplist: 10,
                                isresult: 1
                            });
                            setCpList(Array(10).fill(''));
                        } catch (err) {
                            alert('Failed to create category');
                        }
                    }}
                >Create</button>
            </div>
        </div>
    </div>
)}
        </div>
    );
};

export default RaceSetup;