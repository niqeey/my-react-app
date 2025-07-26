import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // <-- add useNavigate
import { authFetch } from '../utils/authFetch';
import apiBase from '../apiBase';

const EventPage = () => {
    const { eventId } = useParams();
    const navigate = useNavigate(); // <-- add this
    const [categories, setCategories] = useState([]);
    const [eventName, setEventName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCatId, setSelectedCatId] = useState(null);
    const [selectedCat, setSelectedCat] = useState(null); // store selected cat object
    const [catDetail, setCatDetail] = useState(null);
    const [catDetailLoading, setCatDetailLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
    const [participantDetails, setParticipantDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [bibInput, setBibInput] = useState(''); // <-- Added bibInput state
    const [isModalVisible, setIsModalVisible] = useState(false);
    
    // Load categories
    useEffect(() => {
        authFetch(`${apiBase}/race/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId })
        })
        .then(res => res.json())
        .then(data => {
            const cats = Array.isArray(data) ? data : data.categories || [];
            setCategories(cats);
            if (cats.length > 0) {
                setEventName(cats[0].eventName || '');
                sessionStorage.setItem('eventName', cats[0].eventName || ''); // <-- Store in sessionStorage
                setSelectedCatId(cats[0].catId);
                setSelectedCat(cats[0]);
            } else {
                setEventName('');
                sessionStorage.removeItem('eventName'); // <-- Remove if not found
            }
            setLoading(false);
        })
        .catch(() => {
            setError('Failed to load categories');
            setLoading(false);
        });
    }, [eventId]);

    // Fetch report on tab click
    useEffect(() => {
        if (!selectedCat) return;
        setCatDetailLoading(true);
        setCatDetail(null);
        fetch(`${apiBase}/report/event/category`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventId,
                category: selectedCat.cat // use cat code, e.g. "A"
            })
        })
        .then(res => res.json())
        .then(data => {
            setCatDetail(data);
            setCatDetailLoading(false);
        })
        .catch(() => {
            setCatDetail(null);
            setCatDetailLoading(false);
        });
    }, [selectedCat, eventId]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 600);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchParticipantDetails = async () => {
        if (!bibInput.trim()) {
            alert('Please enter a valid bib number.');
            return;
        }

        setLoadingDetails(true);
        try {
            const response = await fetch(`${apiBase}/participant/details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: eventId, // Use the current eventId
                    bib: bibInput.trim()
                })
            });
            const result = await response.json();

            // Extract and log the cplist
            const cplist = result.cplist ? result.cplist.split(',') : [];
            // console.log('CP List:', cplist);

            setParticipantDetails(result);
            setIsModalVisible(true); // Show the modal
        } catch (error) {
            console.error('Error fetching participant details:', error);
        } finally {
            setLoadingDetails(false);
        }
    };

    if (loading) return <div>Loading categories...</div>;
    if (error) return <div>{error}</div>;

    // Column display name mapping
const columnDisplayNames = {
    rank1Cat: 'Rank',
    bib: 'Bib',
    name: 'Name',
    timeStart: 'TimeStart',
    timeFinish: 'TimeFinish',
    officialTime: 'OfficialTime',
    netTime: 'NetTime',
};

// Get dynamic columns based on cplist
let columns = [];
if (Array.isArray(catDetail) && catDetail.length > 0) {
    // Always show these columns first
    columns = [
        'rank1Cat', 'bib', 'name', 'officialTime', 'netTime', 'timeStart'
    ];

    // Parse cplist for CP columns
    const cplist = catDetail[0].cplist
        ? catDetail[0].cplist.split(',').map(cp => cp.trim().replace('Time', 'time')) // Convert "TimeCP1" to "timeCP1"
        : [];

    // console.log('Raw cplist:', catDetail[0].cplist); // Debugging
    // console.log('Processed cplist:', cplist); // Debugging

    // Dynamically rename timeCP columns
    const availableTimeCPs = cplist.filter(cp => /^timeCP\d+$/.test(cp)); // Ensure valid timeCP keys
    // console.log('Available TimeCPs:', availableTimeCPs); // Debugging

    availableTimeCPs.forEach((key, index) => {
        columnDisplayNames[key] = `Split_${index + 1}`;
        // console.log(`Renaming ${key} to Split_${index + 1}`); // Debugging output
        if (!columns.includes(key)) columns.push(key); // Add to columns if not already present
    });

    // Always show finish and official/net time
    if (!columns.includes('timeFinish')) columns.push('timeFinish');
}

// console.log('Final Columns:', columns); // Debugging
// console.log('Column Display Names:', columnDisplayNames); // Debugging

    function formatTimeNoMs(val) {
        if (typeof val !== 'string') return val;
        // Remove .xxx if present (milliseconds)
        return val.replace(/\.\d{1,3}$/, '');
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                width: '100vw',
                background: 'rgba(255,255,255,0.85)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                padding: '0 2vw'
            }}
        >
            
            <div
                style={{
                    minHeight: 'calc(100vh - 60px)',
                    width: '100%',
                    maxWidth: 1000,
                    margin: '0 auto',
                    padding: '4vw 2vw 24px 2vw',
                    background: 'rgba(255,255,255,0.97)',
                    borderRadius: 12,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {/* Header Section */}
                <div style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    gap: 16
                }}>
                    <h1 style={{
                        margin: '24px 0 16px 0',
                        fontSize: 24,
                        textAlign: 'center',
                        flex: 'none',
                        color: '#555'
                    }}>
                        {eventName ? eventName : 'Event Categories'}
                    </h1>
                </div>

                {/* Search Input and Button Section */}
                <div style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24,
                    gap: 8
                }}>
                    <input
                        type="text"
                        placeholder="Enter Bib Number"
                        value={bibInput}
                        onChange={(e) => setBibInput(e.target.value)}
                        style={{
                            padding: '10px',
                            borderRadius: 6,
                            border: '1px solid #ccc',
                            fontSize: 16,
                            width: '200px'
                        }}
                    />
                    <button
                        onClick={fetchParticipantDetails}
                        style={{
                            background: '#007bff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '10px 20px',
                            fontWeight: 'bold',
                            fontSize: 16,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                    >
                        Search
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                        onClick={() => navigate(`/statistic/${eventId}`)}
                        style={{
                            background: 'rgba(128, 109, 247, 0.89)',
                            color: 'rgba(0, 0, 0, 0.89)',
                            border: 'none',
                            borderRadius: 6,
                            padding: '8px 20px',
                            fontWeight: 'bold',
                            fontSize: 16,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                            marginLeft: 16,
                            height: 40
                        }}
                    >
                        Statistic
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.catId}
                            onClick={() => {
                                setSelectedCatId(cat.catId);
                                setSelectedCat(cat);
                            }}
                            style={{
                                padding: '8px 16px',
                                borderRadius: 6,
                                border: selectedCatId === cat.catId ? '2px solid #007bff' : '1px solid #ccc',
                                background: selectedCatId === cat.catId ? '#e3f0ff' : '#f7f7f7',
                                color: selectedCatId === cat.catId ? '#007bff' : '#333',
                                fontWeight: selectedCatId === cat.catId ? 'bold' : 'normal',
                                cursor: 'pointer',
                                minWidth: 60
                            }}
                        >
                            {cat.cat}
                        </button>
                    ))}
                </div>
                {/* Selected category name below buttons, above table */}
                {selectedCat && (
                    <div
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontWeight: 'bold',
                            fontSize: 18,
                            marginBottom: 8,
                            color: '#333'
                        }}
                    >
                        <span>
                            {selectedCat.cat} - {selectedCat.name}
                        </span>
                        <button
                            onClick={async () => {
                                if (!selectedCat) return;
                                const orgId = sessionStorage.getItem('orgId');
                                const res = await fetch(`${apiBase}/report/event/category/xlsx`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'OrgId': orgId
                                    },
                                    body: JSON.stringify({
                                        eventId,
                                        category: selectedCat.cat
                                    })
                                });
                                if (!res.ok) {
                                    alert('Failed to download Excel file.');
                                    return;
                                }
                                const blob = await res.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${eventName || 'event'}_${selectedCat.cat}_category.xlsx`;
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                                window.URL.revokeObjectURL(url);
                            }}
                            style={{
                                background: '#007bff',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 6,
                                padding: '10px 28px',
                                fontWeight: 'bold',
                                fontSize: 16,
                                cursor: selectedCat ? 'pointer' : 'not-allowed',
                                opacity: selectedCat ? 1 : 0.5
                            }}
                            disabled={!selectedCat}
                        >
                            Download
                        </button>
                    </div>
                )}
                {/* Category Detail Table */}
                {catDetailLoading ? (
                    <div>Loading details...</div>
                ) : catDetail && columns.length > 0 ? (
                    <div style={{ width: '100%' }}>
                        <div style={{
                            width: '100%',
                            overflowX: 'auto', // enables horizontal scroll on mobile
                        }}>
                            <table
                                style={{
                                    width: '100%',
                                    minWidth: 600, // ensures table doesn't shrink too much
                                    maxWidth: '100%',
                                    tableLayout: 'fixed',
                                    borderCollapse: 'collapse',
                                    marginTop: 0,
                                    fontSize: '1rem'
                                }}
                            >
                                <thead>
                                    <tr>
                                        {columns.map(key => {
                                            let width;
                                            if (key === 'rank1Cat') width = '8%';
                                            else if (key === 'bib') width = '8%';
                                            else if (key === 'name') width = '20%';
                                            else width = `${(100 - 8 - 8 - 32) / (columns.length - 3)}%`; // distribute remaining
                                            return (
                                                <th
                                                    key={key}
                                                    style={{
                                                        textAlign: 'left',
                                                        padding: '6px 4px',
                                                        background: '#f0f6ff',
                                                        whiteSpace: 'normal',
                                                        fontSize: 13,
                                                        wordBreak: 'break-word',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        width,
                                                        minWidth: width,
                                                        maxWidth: width,
                                                    }}
                                                >
                                                    {columnDisplayNames[key] || key}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {catDetail.map((row, idx) => (
                                        <tr
                                            key={idx}
                                            style={{
                                                background: idx % 2 === 0 ? '#fff' : '#f7f7f7'
                                            }}
                                        >
                                            {columns.map((key, i) => {
                                                let width;
                                                if (key === 'rank1Cat') width = '8%';
                                                else if (key === 'bib') width = '8%';
                                                else if (key === 'name') width = '20%';
                                                else width = `${(100 - 8 - 8 - 32) / (columns.length - 3)}%`;
                                                return (
                                                    <td
                                                        key={i}
                                                        style={{
                                                            padding: '6px 4px',
                                                            fontSize: 12,
                                                            wordBreak: 'break-word',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            width,
                                                            minWidth: width,
                                                            maxWidth: width,
                                                        }}
                                                    >
                                                        {row[key] !== undefined
                                                            ? (isMobile && (
                                                                key === 'officialTime' ||
                                                                key === 'netTime' ||
                                                                key === 'timeStart' ||
                                                                key === 'timeFinish' ||
                                                                /^timeCP\d+$/.test(key)
                                                            )
                                                                ? formatTimeNoMs(row[key])
                                                                : row[key])
                                                            : ''}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div style={{ color: '#888', textAlign: 'center' }}>Select a category to view details.</div>
                )}
                
            </div>
            {/* Spacer to reserve space for footer */}
            <div style={{ height: 80 }}></div>

            <footer
                style={{
                    width: '100%',
                    height: 60,
                    background: 'rgba(240,246,255,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    color: '#888',
                    position: 'fixed',
                    left: 0,
                    bottom: 0,
                    zIndex: 10
                }}
            >
                © 2025 MyPaceTracker
            </footer>

            {/* Modal for Participant Details */}
{isModalVisible && (
    <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    }}>
        <div style={{
            background: '#fff',
            borderRadius: 8,
            padding: 24,
            width: '90%',
            maxWidth: 500,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            position: 'relative'
        }}>
            <button
                onClick={() => setIsModalVisible(false)}
                style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    background: 'none',
                    border: 'none',
                    fontSize: 18,
                    cursor: 'pointer',
                    color: '#888'
                }}
            >
                &times;
            </button>
            {loadingDetails ? (
                <p>Loading participant details...</p>
            ) : participantDetails ? (
                <div style={{
                    gap: '16px', // Add spacing between the two divs
                    marginTop: '16px', // Add some margin above the container
                    justifyContent: 'space-between', // Space out the divs
                    alignItems: 'center', // Align items at the top
                    align: 'center'
                }}>
                        <h3>{participantDetails.bib} : {participantDetails.name}</h3>
                        <p><strong>Category:</strong> {participantDetails.category}</p>
                <div style={{
                    display: 'flex', // Use flexbox to align items side by side
                    gap: '16px', // Add spacing between the two divs
                    marginTop: '16px', // Add some margin above the container
                    justifyContent: 'space-between', // Space out the divs
                    alignItems: 'flex-start' // Align items at the top
                }}>
                    <div style={{
                        flex: 1, // Allow this div to take up equal space
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}>
                        <p><strong>Gender:</strong> {participantDetails.gender}</p>
<p><strong>Category Rank:</strong> {participantDetails.rank1Cat}</p>
<p><strong>Gender Rank:</strong> {participantDetails.rank1Mix}</p>
<p><strong>Overall Rank:</strong> {participantDetails.rank1Tot}</p>
<p><strong>False Start:</strong> <span style={{ color: participantDetails.fs ? 'red' : 'inherit' }}>{participantDetails.fs ? 'True' : 'False'}</span></p>
<p><strong>Did Not Start:</strong> <span style={{ color: participantDetails.dns ? 'red' : 'inherit' }}>{participantDetails.dns ? 'True' : 'False'}</span></p>
<p><strong>Did Not Finish:</strong> <span style={{ color: participantDetails.dnf ? 'red' : 'inherit' }}>{participantDetails.dnf ? 'True' : 'False'}</span></p>
<p><strong>NSBF:</strong> <span style={{ color: participantDetails.nsbf ? 'red' : 'inherit' }}>{participantDetails.nsbf ? 'True' : 'False'}</span></p>
<p><strong>No Result:</strong> <span style={{ color: participantDetails.nr ? 'red' : 'inherit' }}>{participantDetails.nr ? 'True' : 'False'}</span></p>
<p><strong>Disqualified:</strong> <span style={{ color: participantDetails.dq ? 'red' : 'inherit' }}>{participantDetails.dq ? 'True' : 'False'}</span></p>
<p><strong>Remark:</strong> {participantDetails.remark || 'N/A'}</p>
                    </div>
                    <div style={{
                        flex: 1, // Allow this div to take up equal space
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}>
                        <p><strong>Time Gun:</strong> {participantDetails.timeGun}</p>
                        <p><strong>Time Start:</strong> {participantDetails.timeStart}</p>
                        <p><strong>Time Finish:</strong> {participantDetails.timeFinish}</p>
                        <p><strong>TimeCP1:</strong> {participantDetails.timeCP1 || '-'}</p>
                        <p><strong>TimeCP2:</strong> {participantDetails.timeCP2 || '-'}</p>
                        <p><strong>TimeCP3:</strong> {participantDetails.timeCP3 || '-'}</p>
                        <p><strong>TimeCP4:</strong> {participantDetails.timeCP4 || '-'}</p>
                        <p><strong>TimeCP5:</strong> {participantDetails.timeCP5 || '-'}</p>
                        <p><strong>TimeCP6:</strong> {participantDetails.timeCP6 || '-'}</p>
                        <p><strong>TimeCP7:</strong> {participantDetails.timeCP7 || '-'}</p>
                        <p><strong>TimeCP8:</strong> {participantDetails.timeCP8 || '-'}</p>
                    </div>
                </div>
                </div>
            ) : (
                <p>No details available.</p>
            )}
        </div>
    </div>
)}
        </div>
    );
};

export default EventPage;