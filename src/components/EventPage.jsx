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
    const [isEditing, setIsEditing] = useState(false);
    const [editedDetails, setEditedDetails] = useState(null);
    const [saving, setSaving] = useState(false);
    
    // State for Overall and Gender Rank tabs
    const [viewMode, setViewMode] = useState('category'); // 'category' | 'overall' | 'gender'
    const [selectedDistance, setSelectedDistance] = useState('');
    const [selectedGender, setSelectedGender] = useState('M');
    const [rankData, setRankData] = useState([]);
    const [rankDataLoading, setRankDataLoading] = useState(false);
    const [rankMode, setRankMode] = useState('TIME'); // Track mode for overall/gender views
    
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
    const fetchCategoryData = (silent = false) => {
        if (!selectedCat) return;
        if (!silent) {
            setCatDetailLoading(true);
            setCatDetail(null);
        }
        authFetch(`${apiBase}/report/event/category`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventId,
                category: selectedCat.cat // use cat code, e.g. "A"
            })
        })
        .then(res => res.json())
        .then(data => {
            // Handle both old array format and new wrapper format
            if (data && typeof data === 'object' && data.data !== undefined) {
                // New wrapper format: {mode, data}
                setCatDetail(data.data);
            } else if (Array.isArray(data)) {
                // Old array format for backward compatibility
                setCatDetail(data);
            } else {
                setCatDetail(null);
            }
            if (!silent) {
                setCatDetailLoading(false);
            }
        })
        .catch(() => {
            if (!silent) {
                setCatDetail(null);
                setCatDetailLoading(false);
            }
        });
    };

    useEffect(() => {
        fetchCategoryData();
    }, [selectedCat, eventId]);

    // Auto-refresh disabled
    // useEffect(() => {
    //     if (!selectedCat || selectedCat.raceMode !== 'LAP') return;
    //     
    //     const intervalId = setInterval(() => {
    //         fetchCategoryData(true); // silent = true
    //     }, 5000);

    //     return () => clearInterval(intervalId);
    // }, [selectedCat, eventId]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 600);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch Overall or Gender Rank data
    useEffect(() => {
        if (viewMode === 'category') return;
        if (!selectedDistance) return;
        if (viewMode === 'gender' && !selectedGender) return; // Only proceed if gender is selected
        
        setRankDataLoading(true);
        setRankData([]);
        
        if (viewMode === 'overall') {
            authFetch(`${apiBase}/report/event/overall-rank`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId,
                    distance: selectedDistance
                })
            })
            .then(res => res.json())
            .then(data => {
                // Handle wrapper format: {mode, data}
                if (data && typeof data === 'object' && data.data !== undefined) {
                    setRankMode(data.mode || 'TIME');
                    setRankData(data.data);
                } else if (Array.isArray(data)) {
                    // Old format for backward compatibility
                    setRankMode('TIME');
                    setRankData(data);
                } else {
                    setRankMode('TIME');
                    setRankData([]);
                }
                setRankDataLoading(false);
            })
            .catch(() => {
                setRankData([]);
                setRankDataLoading(false);
            });
        } else if (viewMode === 'gender') {
            authFetch(`${apiBase}/report/event/gender-rank`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId,
                    distance: selectedDistance,
                    gender: selectedGender
                })
            })
            .then(res => res.json())
            .then(data => {
                // Handle wrapper format: {mode, data}
                if (data && typeof data === 'object' && data.data !== undefined) {
                    setRankMode(data.mode || 'TIME');
                    setRankData(data.data);
                } else if (Array.isArray(data)) {
                    // Old format for backward compatibility
                    setRankMode('TIME');
                    setRankData(data);
                } else {
                    setRankMode('TIME');
                    setRankData([]);
                }
                setRankDataLoading(false);
            })
            .catch(() => {
                setRankData([]);
                setRankDataLoading(false);
            });
        }
    }, [viewMode, selectedDistance, selectedGender, eventId]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchParticipantDetails = async () => {
        if (!bibInput.trim()) {
            alert('Please enter a valid bib number.');
            return;
        }

        setLoadingDetails(true);
        try {
            const response = await authFetch(`${apiBase}/participant/details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: eventId, // Use the current eventId
                    bib: bibInput.trim()
                })
            });
            const result = await response.json();

            // Extract and log the cplist
            // const cplist = result.cplist ? result.cplist.split(',') : [];
            // console.log('CP List:', cplist);

            setParticipantDetails(result);
            setEditedDetails(result); // Initialize edited details
            setIsEditing(false); // Start in view mode
            setIsModalVisible(true); // Show the modal
        } catch (error) {
            console.error('Error fetching participant details:', error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleSaveDetails = async () => {
        setSaving(true);
        try {
            const response = await authFetch(`${apiBase}/participant/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: eventId,
                    bib: editedDetails.bib,
                    name: editedDetails.name,
                    category: editedDetails.category,
                    gender: editedDetails.gender,
                    remark: editedDetails.remark,
                    fs: editedDetails.fs,
                    dns: editedDetails.dns,
                    dnf: editedDetails.dnf,
                    nsbf: editedDetails.nsbf,
                    nr: editedDetails.nr,
                    dq: editedDetails.dq,
                    timeGun: editedDetails.timeGun,
                    timeStart: editedDetails.timeStart,
                    timeFinish: editedDetails.timeFinish,
                    timeCP1: editedDetails.timeCP1,
                    timeCP2: editedDetails.timeCP2,
                    timeCP3: editedDetails.timeCP3,
                    timeCP4: editedDetails.timeCP4,
                    timeCP5: editedDetails.timeCP5,
                    timeCP6: editedDetails.timeCP6,
                    timeCP7: editedDetails.timeCP7,
                    timeCP8: editedDetails.timeCP8
                })
            });
            
            if (response.ok) {
                setParticipantDetails(editedDetails);
                setIsEditing(false);
                alert('Participant details updated successfully!');
            } else {
                alert('Failed to update participant details.');
            }
        } catch (error) {
            console.error('Error updating participant details:', error);
            alert('An error occurred while updating details.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditedDetails(participantDetails);
        setIsEditing(false);
    };

    const handleFieldChange = (field, value) => {
        setEditedDetails(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (loading) return <div>Loading categories...</div>;
    if (error) return <div>{error}</div>;

    // Column display name mapping
const columnDisplayNames = {
    rank1Cat: 'Rank',
    rank1Tot: 'Overall',
    rank1Mix: 'Gender',
    bib: 'Bib',
    name: 'Name',
    cat: 'Category',
    timeStart: 'TimeStart',
    timeFinish: 'TimeFinish',
    officialTime: 'OfficialTime',
    netTime: 'NetTime',
};

// Get dynamic columns based on view mode
let columns = [];
let displayData = [];

if (viewMode === 'category') {
    displayData = catDetail;
    if (Array.isArray(catDetail) && catDetail.length > 0) {
        // Check if this is LAP mode
        const isLapMode = selectedCat && selectedCat.raceMode === 'LAP';
        
        if (isLapMode) {
            // LAP mode: build columns based on checkpointlist
            // checkpointlist format: "200,400,12,5000" where:
            // 1st = halflap distance, 2nd = fulllap distance, 3rd = lap count, 4th = total distance
            columns = [
                'rank1Cat', 'bib', 'name', 'lap', 'timeStart', 'timeFinish'
            ];
            
            // Parse checkpointlist to determine number of lap times
            if (selectedCat.checkpointlist) {
                const parts = selectedCat.checkpointlist.split(',');
                const lapCount = parseInt(parts[2]) || 0;
                // Check if halflap > 0 from cplist first field
                const halflap = parseInt(parts[0]) || 0;
                const includeTimeZero = halflap > 0;
                
                // Add "1/2 Lap" column if halflap > 0
                if (includeTimeZero) {
                    columns.push('time0');
                    columnDisplayNames['time0'] = '1/2 Lap';
                }
                
                // Add time columns for each lap (always time1, time2, etc.)
                for (let i = 0; i < lapCount; i++) {
                    const timeKey = `time${i + 1}`;
                    columns.push(timeKey);
                    columnDisplayNames[timeKey] = `Lap ${i + 1}`;
                }
            }
            
            // Process display data to calculate lap numbers dynamically
            displayData = catDetail
                .map(row => {
                    // Calculate lap = highest lap number with data (exclude time0)
                    let maxLap = null;
                    let lastLapTime = null;
                    const lapTimes = row.lapTimes || {};
                    // Always start from time1 for lap counting (time0 is half-lap, not a full lap)
                    for (let i = 1; i <= 99; i++) {
                        if (lapTimes[`time${i}`] !== null && lapTimes[`time${i}`] !== undefined) {
                            maxLap = i;
                            lastLapTime = lapTimes[`time${i}`];
                        }
                    }
                    const finishSeconds = timeToSeconds(lastLapTime);
                    const startSeconds = timeToSeconds(row.timeStart);
                    const gunSeconds = timeToSeconds(row.timeGun);
                    const officialTime = (finishSeconds !== Infinity && startSeconds !== Infinity)
                        ? formatSeconds(finishSeconds - startSeconds)
                        : row.officialTime;
                    const netTime = (finishSeconds !== Infinity && gunSeconds !== Infinity)
                        ? formatSeconds(finishSeconds - gunSeconds)
                        : row.netTime;
                    return {
                        ...row,
                        ...lapTimes, // Flatten lapTimes to row level (time0, time1, time2, etc.)
                        lap: maxLap, // lap count = highest timeN index (time1=Lap 1, time2=Lap 2, etc.)
                        timeFinish: lastLapTime || row.timeFinish, // Map timeFinish to last lap time
                        officialTime,
                        netTime
                    };
                })
                // Filter out participants without valid rank1Cat (null or 0)
                .filter(row => row.rank1Cat && row.rank1Cat > 0)
                // Sort by rank1Cat ascending
                .sort((a, b) => {
                    const rankA = a.rank1Cat || Infinity;
                    const rankB = b.rank1Cat || Infinity;
                    return rankA - rankB;
                });
        } else {
            // NORMAL mode: build columns from cplist (checkpoint list in response)
            columns = [
                'rank1Cat', 'bib', 'name', 'officialTime', 'netTime', 'timeStart'
            ];

            // Parse cplist for CP columns
            const cplist = catDetail[0].cplist
                ? catDetail[0].cplist.split(',').map(cp => cp.trim().replace('Time', 'time')) // Convert "TimeCP1" to "timeCP1"
                : [];

            // Dynamically rename timeCP columns
            const availableTimeCPs = cplist.filter(cp => /^timeCP\d+$/.test(cp)); // Ensure valid timeCP keys
            availableTimeCPs.forEach((key, index) => {
                columnDisplayNames[key] = `Split_${index + 1}`;
                if (!columns.includes(key)) columns.push(key); // Add to columns if not already present
            });

            // Always show finish and official/net time
            if (!columns.includes('timeFinish')) columns.push('timeFinish');
        }
    }
} else if (viewMode === 'overall') {
    displayData = rankData;
    if (Array.isArray(rankData) && rankData.length > 0) {
        // Check if this is LAP mode
        if (rankMode === 'LAP') {
            // LAP mode: build columns based on lap data
            columns = [
                'rank1Tot', 'rank1Mix', 'rank1Cat', 'lap', 'bib', 'name', 'cat', 'timeStart', 'officialTime', 'netTime'
            ];
            
            // Get max laps dynamically
            const maxLaps = Math.max(...rankData.map(row => row.lap || 0));
            
            // Check if halflap exists (time0)
            const hasHalfLap = rankData.some(row => row.lapTimes && row.lapTimes.time0);
            
            // Add "1/2 Lap" column if halflap exists
            if (hasHalfLap) {
                columns.push('time0');
                columnDisplayNames['time0'] = '1/2 Lap';
            }
            
            // Add time columns for each lap based on max displayed laps (maxLaps - 1)
            for (let i = 1; i < maxLaps; i++) {
                const timeKey = `time${i}`;
                columns.push(timeKey);
                columnDisplayNames[timeKey] = `Lap ${i}`;
            }
            
            // Always add timeFinish
            columns.push('timeFinish');
            
            // Process display data to flatten lap times
            displayData = rankData
                .map(row => {
                    const lapTimes = row.lapTimes || {};

                    // Find last lap time
                    let lastLapTime = null;
                    for (let i = 1; i <= 99; i++) {
                        if (lapTimes[`time${i}`]) {
                            lastLapTime = lapTimes[`time${i}`];
                        }
                    }
                    const finishSeconds = timeToSeconds(lastLapTime);
                    const startSeconds = timeToSeconds(row.timeStart);
                    const gunSeconds = timeToSeconds(row.timeGun);
                    const officialTime = (finishSeconds !== Infinity && startSeconds !== Infinity)
                        ? formatSeconds(finishSeconds - startSeconds)
                        : row.officialTime;
                    const netTime = (finishSeconds !== Infinity && gunSeconds !== Infinity)
                        ? formatSeconds(finishSeconds - gunSeconds)
                        : row.netTime;
                    return {
                        ...row,
                        ...lapTimes, // Flatten lapTimes to row level
                        timeFinish: lastLapTime || row.timeFinish,
                        officialTime,
                        netTime
                    };
                })
                // Filter out participants without valid rank
                .filter(row => row.rank1Cat && row.rank1Cat > 0)
                // Sort by rank ascending
                .sort((a, b) => {
                    const rankA = a.rank1Cat || Infinity;
                    const rankB = b.rank1Cat || Infinity;
                    return rankA - rankB;
                });
        } else {
            // TIME mode: parse cplist for checkpoint columns
            columns = [
                'rank1Tot', 'rank1Mix', 'rank1Cat', 'bib', 'name', 'cat', 'officialTime', 'netTime', 'timeStart'
            ];
            
            // Parse cplist for CP columns
            if (rankData[0] && rankData[0].cplist) {
                const cplist = rankData[0].cplist.split(',').map(cp => cp.trim().replace('Time', 'time'));
                const availableTimeCPs = cplist.filter(cp => /^timeCP\d+$/.test(cp));
                availableTimeCPs.forEach((key, index) => {
                    columnDisplayNames[key] = `Split_${index + 1}`;
                    if (!columns.includes(key)) columns.push(key);
                });
            }
            
            // Always show finish time
            if (!columns.includes('timeFinish')) columns.push('timeFinish');
        }
    }
} else if (viewMode === 'gender') {
    displayData = rankData;
    if (Array.isArray(rankData) && rankData.length > 0) {
        // Check if this is LAP mode
        if (rankMode === 'LAP') {
            // LAP mode: build columns based on lap data
            columns = [
                'rank1Mix', 'rank1Cat', 'lap', 'bib', 'name', 'cat', 'timeStart', 'officialTime', 'netTime'
            ];
            
            // Get max laps dynamically
            const maxLaps = Math.max(...rankData.map(row => row.lap || 0));
            
            // Check if halflap exists (time0)
            const hasHalfLap = rankData.some(row => row.lapTimes && row.lapTimes.time0);
            
            // Add "1/2 Lap" column if halflap exists
            if (hasHalfLap) {
                columns.push('time0');
                columnDisplayNames['time0'] = '1/2 Lap';
            }
            
            // Add time columns for each lap based on max displayed laps (maxLaps - 1)
            for (let i = 1; i < maxLaps; i++) {
                const timeKey = `time${i}`;
                columns.push(timeKey);
                columnDisplayNames[timeKey] = `Lap ${i}`;
            }
            
            // Always add timeFinish
            columns.push('timeFinish');
            
            // Process display data to flatten lap times
            displayData = rankData
                .map(row => {
                    const lapTimes = row.lapTimes || {};
                    // Find last lap time
                    let lastLapTime = null;
                    for (let i = 1; i <= 99; i++) {
                        if (lapTimes[`time${i}`]) {
                            lastLapTime = lapTimes[`time${i}`];
                        }
                    }
                    const finishSeconds = timeToSeconds(lastLapTime);
                    const startSeconds = timeToSeconds(row.timeStart);
                    const gunSeconds = timeToSeconds(row.timeGun);
                    const officialTime = (finishSeconds !== Infinity && startSeconds !== Infinity)
                        ? formatSeconds(finishSeconds - startSeconds)
                        : row.officialTime;
                    const netTime = (finishSeconds !== Infinity && gunSeconds !== Infinity)
                        ? formatSeconds(finishSeconds - gunSeconds)
                        : row.netTime;
                    return {
                        ...row,
                        ...lapTimes, // Flatten lapTimes to row level
                        timeFinish: lastLapTime || row.timeFinish,
                        officialTime,
                        netTime
                    };
                })
                // Filter out participants without valid rank
                .filter(row => row.rank1Cat && row.rank1Cat > 0)
                // Sort by rank ascending
                .sort((a, b) => {
                    const rankA = a.rank1Cat || Infinity;
                    const rankB = b.rank1Cat || Infinity;
                    return rankA - rankB;
                });
        } else {
            // TIME mode: parse cplist for checkpoint columns
            columns = [
                'rank1Mix', 'rank1Cat', 'bib', 'name', 'cat', 'officialTime', 'netTime', 'timeStart'
            ];
            
            // Parse cplist for CP columns
            if (rankData[0] && rankData[0].cplist) {
                const cplist = rankData[0].cplist.split(',').map(cp => cp.trim().replace('Time', 'time'));
                const availableTimeCPs = cplist.filter(cp => /^timeCP\d+$/.test(cp));
                availableTimeCPs.forEach((key, index) => {
                    columnDisplayNames[key] = `Split_${index + 1}`;
                    if (!columns.includes(key)) columns.push(key);
                });
            }
            
            // Always show finish time
            if (!columns.includes('timeFinish')) columns.push('timeFinish');
        }
    }
}

// Get dynamic columns based on cplist (LEGACY - keeping for backwards compatibility)
// let columns = [];
// if (Array.isArray(catDetail) && catDetail.length > 0) {
//     // Always show these columns first
//     columns = [
//         'rank1Cat', 'bib', 'name', 'officialTime', 'netTime', 'timeStart'
//     ];

//     // Parse cplist for CP columns
//     const cplist = catDetail[0].cplist
//         ? catDetail[0].cplist.split(',').map(cp => cp.trim().replace('Time', 'time')) // Convert "TimeCP1" to "timeCP1"
//         : [];

//     // console.log('Raw cplist:', catDetail[0].cplist); // Debugging
//     // console.log('Processed cplist:', cplist); // Debugging

//     // Dynamically rename timeCP columns
//     const availableTimeCPs = cplist.filter(cp => /^timeCP\d+$/.test(cp)); // Ensure valid timeCP keys
//     // console.log('Available TimeCPs:', availableTimeCPs); // Debugging

//     availableTimeCPs.forEach((key, index) => {
//         columnDisplayNames[key] = `Split_${index + 1}`;
//         // console.log(`Renaming ${key} to Split_${index + 1}`); // Debugging output
//         if (!columns.includes(key)) columns.push(key); // Add to columns if not already present
//     });

//     // Always show finish and official/net time
//     if (!columns.includes('timeFinish')) columns.push('timeFinish');
// }

// console.log('Final Columns:', columns); // Debugging
// console.log('Column Display Names:', columnDisplayNames); // Debugging

    function formatTimeNoMs(val) {
        if (typeof val !== 'string') return val;
        // Remove .xxx if present (milliseconds)
        return val.replace(/\.\d{1,3}$/, '');
    }

    function timeToSeconds(timeStr) {
        if (!timeStr || timeStr === '-' || timeStr === '0') return Infinity;
        const parts = timeStr.split(':');
        if (parts.length < 3) return Infinity;
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const secondsWithMs = parseFloat(parts[2]);
        if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(secondsWithMs)) {
            return Infinity;
        }
        return (hours * 3600) + (minutes * 60) + secondsWithMs;
    }

    function formatSeconds(totalSeconds) {
        if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '';
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secondsWithMs = totalSeconds % 60;
        const secondsFormatted = secondsWithMs.toFixed(3);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secondsFormatted).padStart(6, '0')}`;
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
                    <button
                        onClick={() => {
                            const isLapMode = selectedCat && selectedCat.raceMode === 'LAP';
                            const url = isLapMode 
                                ? `/public/lap-leaderboard/${eventId}` 
                                : `/public/leaderboard/${eventId}`;
                            window.open(url, '_blank');
                        }}
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '8px 20px',
                            fontWeight: 'bold',
                            fontSize: 16,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            height: 40
                        }}
                    >
                        🏆 Leaderboard
                    </button>
                    <button
                        onClick={() => {
                            setViewMode('overall');
                            const distances = [...new Set(categories.map(c => c.distance).filter(Boolean))];
                            if (distances.length > 0 && !selectedDistance) {
                                setSelectedDistance(distances[0]);
                            }
                        }}
                        style={{
                            background: viewMode === 'overall' ? '#ffc107' : '#fff',
                            color: viewMode === 'overall' ? '#fff' : '#333',
                            border: viewMode === 'overall' ? '2px solid #ffc107' : '1px solid #ccc',
                            borderRadius: 6,
                            padding: '8px 20px',
                            fontWeight: viewMode === 'overall' ? 'bold' : 'normal',
                            fontSize: 16,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                            height: 40
                        }}
                    >
                        📊 Overall Rank
                    </button>
                    <button
                        onClick={() => {
                            setViewMode('gender');
                            const distances = [...new Set(categories.map(c => c.distance).filter(Boolean))];
                            if (distances.length > 0 && !selectedDistance) {
                                setSelectedDistance(distances[0]);
                            }
                        }}
                        style={{
                            background: viewMode === 'gender' ? '#17a2b8' : '#fff',
                            color: viewMode === 'gender' ? '#fff' : '#333',
                            border: viewMode === 'gender' ? '2px solid #17a2b8' : '1px solid #ccc',
                            borderRadius: 6,
                            padding: '8px 20px',
                            fontWeight: viewMode === 'gender' ? 'bold' : 'normal',
                            fontSize: 16,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                            height: 40
                        }}
                    >
                        👥 Gender Rank
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.catId}
                            onClick={() => {
                                setViewMode('category');
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

                {/* Distance selector for Overall and Gender Rank */}
                {(viewMode === 'overall' || viewMode === 'gender') && (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center', justifyContent: 'center' }}>
                        <label style={{ fontWeight: 'bold', fontSize: 16 }}>Distance:</label>
                        <select
                            value={selectedDistance}
                            onChange={(e) => setSelectedDistance(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: 6,
                                border: '1px solid #ccc',
                                fontSize: 16,
                                cursor: 'pointer'
                            }}
                        >
                            {[...new Set(categories.map(c => c.distance).filter(Boolean))].map(dist => (
                                <option key={dist} value={dist}>{dist}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Gender selector for Gender Rank */}
                {viewMode === 'gender' && (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center', justifyContent: 'center' }}>
                        <label style={{ fontWeight: 'bold', fontSize: 16 }}>Gender:</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                onClick={() => setSelectedGender('M')}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: 6,
                                    border: selectedGender === 'M' ? '2px solid #007bff' : '1px solid #ccc',
                                    background: selectedGender === 'M' ? '#007bff' : '#f7f7f7',
                                    color: selectedGender === 'M' ? '#fff' : '#333',
                                    fontWeight: selectedGender === 'M' ? 'bold' : 'normal',
                                    fontSize: 16,
                                    cursor: 'pointer'
                                }}
                            >
                                Male
                            </button>
                            <button
                                onClick={() => setSelectedGender('F')}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: 6,
                                    border: selectedGender === 'F' ? '2px solid #007bff' : '1px solid #ccc',
                                    background: selectedGender === 'F' ? '#007bff' : '#f7f7f7',
                                    color: selectedGender === 'F' ? '#fff' : '#333',
                                    fontWeight: selectedGender === 'F' ? 'bold' : 'normal',
                                    fontSize: 16,
                                    cursor: 'pointer'
                                }}
                            >
                                Female
                            </button>
                        </div>
                    </div>
                )}

                {/* Download button for Overall Rank */}
                {viewMode === 'overall' && selectedDistance && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                        <button
                            onClick={async () => {
                                const orgId = sessionStorage.getItem('orgId');
                                const res = await authFetch(`${apiBase}/report/event/overall-rank/xlsx`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'OrgId': orgId
                                    },
                                    body: JSON.stringify({
                                        eventId,
                                        distance: selectedDistance
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
                                a.download = `${eventName || 'event'}_overall_rank_${selectedDistance}.xlsx`;
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
                                cursor: 'pointer'
                            }}
                        >
                            Download Overall Rank
                        </button>
                    </div>
                )}

                {/* Download button for Gender Rank */}
                {viewMode === 'gender' && selectedDistance && selectedGender && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                        <button
                            onClick={async () => {
                                const orgId = sessionStorage.getItem('orgId');
                                const res = await authFetch(`${apiBase}/report/event/gender-rank/xlsx`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'OrgId': orgId
                                    },
                                    body: JSON.stringify({
                                        eventId,
                                        distance: selectedDistance,
                                        gender: selectedGender
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
                                a.download = `${eventName || 'event'}_gender_rank_${selectedDistance}_${selectedGender}.xlsx`;
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
                                cursor: 'pointer'
                            }}
                        >
                            Download Gender Rank
                        </button>
                    </div>
                )}

                {/* Selected category name below buttons, above table */}
                {viewMode === 'category' && selectedCat && (
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
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={async () => {
                                    if (!eventId) return;
                                    if (!window.confirm('Calculate ranks for all categories in this event?')) return;
                                    try {
                                        const res = await authFetch(`${apiBase}/report/event/calculate-ranks`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ eventId })
                                        });
                                        if (res.ok) {
                                            alert('Ranks calculated successfully!');
                                            // Refresh the current category data
                                            window.location.reload();
                                        } else {
                                            alert('Failed to calculate ranks.');
                                        }
                                    } catch (err) {
                                        alert('Error calculating ranks.');
                                    }
                                }}
                                style={{
                                    background: '#28a745',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '10px 28px',
                                    fontWeight: 'bold',
                                    fontSize: 16,
                                    cursor: 'pointer'
                                }}
                            >
                                Calculate Rank
                            </button>
                            <button
                                onClick={async () => {
                                    if (!selectedCat) return;
                                    const orgId = sessionStorage.getItem('orgId');
                                    const res = await authFetch(`${apiBase}/report/event/category/xlsx`, {
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
                    </div>
                )}
                {/* Category Detail Table */}
                {(viewMode === 'category' && catDetailLoading) || ((viewMode === 'overall' || viewMode === 'gender') && rankDataLoading) ? (
                    <div>Loading details...</div>
                ) : displayData && columns.length > 0 ? (
                    <div style={{ width: '100%' }}>
                        {selectedCat && selectedCat.raceMode === 'LAP' ? (
                            // LAP mode: Split table with sticky columns
                            <div style={{ display: 'flex', width: '100%' }}>
                                {/* Fixed columns table */}
                                <div style={{ flexShrink: 0 }}>
                                    <table style={{
                                        borderCollapse: 'collapse',
                                        marginTop: 0,
                                        fontSize: '1rem'
                                    }}>
                                        <thead>
                                            <tr>
                                                {['rank1Cat', 'bib', 'name', 'lap', 'timeStart', 'timeFinish'].map(key => (
                                                    <th
                                                        key={key}
                                                        style={{
                                                            textAlign: 'left',
                                                            padding: '8px 12px',
                                                            background: '#f0f6ff',
                                                            whiteSpace: 'nowrap',
                                                            fontSize: 13,
                                                            fontWeight: 'bold',
                                                            border: '1px solid #ddd',
                                                        }}
                                                    >
                                                        {columnDisplayNames[key] || key}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayData.map((row, idx) => (
                                                <tr
                                                    key={idx}
                                                    style={{
                                                        background: idx % 2 === 0 ? '#fff' : '#f7f7f7',
                                                        height: '40px'
                                                    }}
                                                >
                                                    {['rank1Cat', 'bib', 'name', 'lap', 'timeStart', 'timeFinish'].map((key, i) => (
                                                        <td
                                                            key={i}
                                                            style={{
                                                                padding: '8px 12px',
                                                                fontSize: 12,
                                                                whiteSpace: 'nowrap',
                                                                border: '1px solid #ddd',
                                                            }}
                                                        >
                                                            {row[key] !== undefined
                                                                ? (isMobile && (
                                                                    key === 'timeStart' ||
                                                                    key === 'timeFinish'
                                                                )
                                                                    ? formatTimeNoMs(row[key])
                                                                    : row[key])
                                                                : ''}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Scrollable lap time columns */}
                                <div style={{ 
                                    overflowX: 'auto', 
                                    flexGrow: 1,
                                    borderLeft: '2px solid #999' 
                                }}>
                                    <table style={{
                                        borderCollapse: 'collapse',
                                        marginTop: 0,
                                        fontSize: '1rem',
                                        width: '100%'
                                    }}>
                                        <thead>
                                            <tr>
                                                {columns.filter(key => /^time\d+$/.test(key)).map(key => (
                                                    <th
                                                        key={key}
                                                        style={{
                                                            textAlign: 'left',
                                                            padding: '8px 12px',
                                                            background: '#f0f6ff',
                                                            whiteSpace: 'nowrap',
                                                            fontSize: 13,
                                                            fontWeight: 'bold',
                                                            border: '1px solid #ddd',
                                                        }}
                                                    >
                                                        {columnDisplayNames[key] || key}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayData.map((row, idx) => {
                                                const lapTimes = row.lapTimes || {};
                                                return (
                                                <tr
                                                    key={idx}
                                                    style={{
                                                        background: idx % 2 === 0 ? '#fff' : '#f7f7f7',
                                                        height: '40px'
                                                    }}
                                                >
                                                    {columns.filter(key => /^time\d+$/.test(key)).map((key, i) => (
                                                        <td
                                                            key={i}
                                                            style={{
                                                                padding: '8px 12px',
                                                                fontSize: 12,
                                                                whiteSpace: 'nowrap',
                                                                border: '1px solid #ddd',
                                                            }}
                                                        >
                                                            {lapTimes[key] !== undefined && lapTimes[key] !== null
                                                                ? (isMobile ? formatTimeNoMs(lapTimes[key]) : lapTimes[key])
                                                                : ''}
                                                        </td>
                                                    ))}
                                                </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            // NORMAL mode: Single scrollable table
                            <div style={{
                                width: '100%',
                                overflowX: 'auto',
                            }}>
                                <table
                                    style={{
                                        width: '100%',
                                        minWidth: 'min-content',
                                        tableLayout: 'auto',
                                        borderCollapse: 'collapse',
                                        marginTop: 0,
                                        fontSize: '1rem'
                                    }}
                                >
                                    <thead>
                                        <tr>
                                            {columns.map(key => {
                                                return (
                                                    <th
                                                        key={key}
                                                        style={{
                                                            textAlign: 'left',
                                                            padding: '8px 12px',
                                                            background: '#f0f6ff',
                                                            whiteSpace: 'nowrap',
                                                            fontSize: 13,
                                                            fontWeight: 'bold',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            border: '1px solid #ddd',
                                                            minWidth: 'auto',
                                                        }}
                                                    >
                                                        {columnDisplayNames[key] || key}
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayData.map((row, idx) => (
                                            <tr
                                                key={idx}
                                                style={{
                                                    background: idx % 2 === 0 ? '#fff' : '#f7f7f7'
                                                }}
                                            >
                                                {columns.map((key, i) => {
                                                    return (
                                                        <td
                                                            key={i}
                                                            style={{
                                                                padding: '8px 12px',
                                                                fontSize: 12,
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                border: '1px solid #ddd',
                                                            }}
                                                        >
                                                            {row[key] !== undefined
                                                                ? (isMobile && (
                                                                    key === 'officialTime' ||
                                                                    key === 'netTime' ||
                                                                    key === 'timeStart' ||
                                                                    key === 'timeFinish' ||
                                                                    /^time\d+$/.test(key) ||
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
                        )}
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
                onClick={() => {
                    setIsModalVisible(false);
                    setIsEditing(false);
                }}
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
                    gap: '16px',
                    marginTop: '16px',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    align: 'center'
                }}>
                        <h3>
                            {isEditing ? (
                                <>
                                    <input
                                        type="text"
                                        value={editedDetails.bib}
                                        onChange={(e) => handleFieldChange('bib', e.target.value)}
                                        style={{ width: '80px', marginRight: '8px', padding: '4px' }}
                                    />
                                    :
                                    <input
                                        type="text"
                                        value={editedDetails.name}
                                        onChange={(e) => handleFieldChange('name', e.target.value)}
                                        style={{ width: '300px', marginLeft: '8px', padding: '4px' }}
                                    />
                                </>
                            ) : (
                                `${participantDetails.bib} : ${participantDetails.name}`
                            )}
                        </h3>
                        <p>
                            <strong>Category:</strong>{' '}
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedDetails.category}
                                    onChange={(e) => handleFieldChange('category', e.target.value)}
                                    style={{ width: '100px', padding: '4px' }}
                                />
                            ) : (
                                participantDetails.category
                            )}
                        </p>
                <div style={{
                    display: 'flex',
                    gap: '16px',
                    marginTop: '16px',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                }}>
                    <div style={{
                        flex: 1,
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}>
                        <p>
                            <strong>Gender:</strong>{' '}
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedDetails.gender}
                                    onChange={(e) => handleFieldChange('gender', e.target.value)}
                                    style={{ width: '50px', padding: '4px' }}
                                />
                            ) : (
                                participantDetails.gender
                            )}
                        </p>
                        <p><strong>Category Rank:</strong> {participantDetails.rank1Cat}</p>
                        <p><strong>Gender Rank:</strong> {participantDetails.rank1Mix}</p>
                        <p><strong>Overall Rank:</strong> {participantDetails.rank1Tot}</p>
                        <p>
                            <strong>False Start:</strong>{' '}
                            {isEditing ? (
                                <input
                                    type="checkbox"
                                    checked={editedDetails.fs}
                                    onChange={(e) => handleFieldChange('fs', e.target.checked)}
                                />
                            ) : (
                                <span style={{ color: participantDetails.fs ? 'red' : 'inherit' }}>
                                    {participantDetails.fs ? 'True' : 'False'}
                                </span>
                            )}
                        </p>
                        <p>
                            <strong>Did Not Start:</strong>{' '}
                            {isEditing ? (
                                <input
                                    type="checkbox"
                                    checked={editedDetails.dns}
                                    onChange={(e) => handleFieldChange('dns', e.target.checked)}
                                />
                            ) : (
                                <span style={{ color: participantDetails.dns ? 'red' : 'inherit' }}>
                                    {participantDetails.dns ? 'True' : 'False'}
                                </span>
                            )}
                        </p>
                        <p>
                            <strong>Did Not Finish:</strong>{' '}
                            {isEditing ? (
                                <input
                                    type="checkbox"
                                    checked={editedDetails.dnf}
                                    onChange={(e) => handleFieldChange('dnf', e.target.checked)}
                                />
                            ) : (
                                <span style={{ color: participantDetails.dnf ? 'red' : 'inherit' }}>
                                    {participantDetails.dnf ? 'True' : 'False'}
                                </span>
                            )}
                        </p>
                        <p>
                            <strong>NSBF:</strong>{' '}
                            {isEditing ? (
                                <input
                                    type="checkbox"
                                    checked={editedDetails.nsbf}
                                    onChange={(e) => handleFieldChange('nsbf', e.target.checked)}
                                />
                            ) : (
                                <span style={{ color: participantDetails.nsbf ? 'red' : 'inherit' }}>
                                    {participantDetails.nsbf ? 'True' : 'False'}
                                </span>
                            )}
                        </p>
                        <p>
                            <strong>No Result:</strong>{' '}
                            {isEditing ? (
                                <input
                                    type="checkbox"
                                    checked={editedDetails.nr}
                                    onChange={(e) => handleFieldChange('nr', e.target.checked)}
                                />
                            ) : (
                                <span style={{ color: participantDetails.nr ? 'red' : 'inherit' }}>
                                    {participantDetails.nr ? 'True' : 'False'}
                                </span>
                            )}
                        </p>
                        <p>
                            <strong>Disqualified:</strong>{' '}
                            {isEditing ? (
                                <input
                                    type="checkbox"
                                    checked={editedDetails.dq}
                                    onChange={(e) => handleFieldChange('dq', e.target.checked)}
                                />
                            ) : (
                                <span style={{ color: participantDetails.dq ? 'red' : 'inherit' }}>
                                    {participantDetails.dq ? 'True' : 'False'}
                                </span>
                            )}
                        </p>
                        <p>
                            <strong>Remark:</strong>{' '}
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedDetails.remark || ''}
                                    onChange={(e) => handleFieldChange('remark', e.target.value)}
                                    style={{ width: '100%', padding: '4px', marginTop: '4px' }}
                                />
                            ) : (
                                participantDetails.remark || 'N/A'
                            )}
                        </p>
                    </div>
                    <div style={{
                        flex: 1,
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}>
                        <p>
                            <strong>Time Gun:</strong>{' '}
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedDetails.timeGun || ''}
                                    onChange={(e) => handleFieldChange('timeGun', e.target.value)}
                                    placeholder="HH:MM:SS"
                                    style={{ width: '100px', padding: '4px' }}
                                />
                            ) : (
                                participantDetails.timeGun
                            )}
                        </p>
                        <p>
                            <strong>Time Start:</strong>{' '}
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedDetails.timeStart || ''}
                                    onChange={(e) => handleFieldChange('timeStart', e.target.value)}
                                    placeholder="HH:MM:SS"
                                    style={{ width: '100px', padding: '4px' }}
                                />
                            ) : (
                                participantDetails.timeStart
                            )}
                        </p>
                        <p>
                            <strong>Time Finish:</strong>{' '}
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedDetails.timeFinish || ''}
                                    onChange={(e) => handleFieldChange('timeFinish', e.target.value)}
                                    placeholder="HH:MM:SS"
                                    style={{ width: '100px', padding: '4px' }}
                                />
                            ) : (
                                participantDetails.timeFinish
                            )}
                        </p>
                        <p>
                            <strong>TimeCP1:</strong>{' '}
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedDetails.timeCP1 || ''}
                                    onChange={(e) => handleFieldChange('timeCP1', e.target.value)}
                                    placeholder="HH:MM:SS"
                                    style={{ width: '100px', padding: '4px' }}
                                />
                            ) : (
                                participantDetails.timeCP1 || '-'
                            )}
                        </p>
                        <p>
                            <strong>TimeCP2:</strong>{' '}
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedDetails.timeCP2 || ''}
                                    onChange={(e) => handleFieldChange('timeCP2', e.target.value)}
                                    placeholder="HH:MM:SS"
                                    style={{ width: '100px', padding: '4px' }}
                                />
                            ) : (
                                participantDetails.timeCP2 || '-'
                            )}
                        </p>
                        <p>
                            <strong>TimeCP3:</strong>{' '}
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedDetails.timeCP3 || ''}
                                    onChange={(e) => handleFieldChange('timeCP3', e.target.value)}
                                    placeholder="HH:MM:SS"
                                    style={{ width: '100px', padding: '4px' }}
                                />
                            ) : (
                                participantDetails.timeCP3 || '-'
                            )}
                        </p>
                        <p>
                            <strong>TimeCP4:</strong>{' '}
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedDetails.timeCP4 || ''}
                                    onChange={(e) => handleFieldChange('timeCP4', e.target.value)}
                                    placeholder="HH:MM:SS"
                                    style={{ width: '100px', padding: '4px' }}
                                />
                            ) : (
                                participantDetails.timeCP4 || '-'
                            )}
                        </p>
                        <p>
                            <strong>TimeCP5:</strong>{' '}
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedDetails.timeCP5 || ''}
                                    onChange={(e) => handleFieldChange('timeCP5', e.target.value)}
                                    placeholder="HH:MM:SS"
                                    style={{ width: '100px', padding: '4px' }}
                                />
                            ) : (
                                participantDetails.timeCP5 || '-'
                            )}
                        </p>
                        <p>
                            <strong>TimeCP6:</strong>{' '}
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedDetails.timeCP6 || ''}
                                    onChange={(e) => handleFieldChange('timeCP6', e.target.value)}
                                    placeholder="HH:MM:SS"
                                    style={{ width: '100px', padding: '4px' }}
                                />
                            ) : (
                                participantDetails.timeCP6 || '-'
                            )}
                        </p>
                        <p>
                            <strong>TimeCP7:</strong>{' '}
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedDetails.timeCP7 || ''}
                                    onChange={(e) => handleFieldChange('timeCP7', e.target.value)}
                                    placeholder="HH:MM:SS"
                                    style={{ width: '100px', padding: '4px' }}
                                />
                            ) : (
                                participantDetails.timeCP7 || '-'
                            )}
                        </p>
                        <p>
                            <strong>TimeCP8:</strong>{' '}
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedDetails.timeCP8 || ''}
                                    onChange={(e) => handleFieldChange('timeCP8', e.target.value)}
                                    placeholder="HH:MM:SS"
                                    style={{ width: '100px', padding: '4px' }}
                                />
                            ) : (
                                participantDetails.timeCP8 || '-'
                            )}
                        </p>
                    </div>
                </div>
                <div style={{ 
                    marginTop: '16px', 
                    display: 'flex', 
                    gap: '8px', 
                    justifyContent: 'flex-end' 
                }}>
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSaveDetails}
                                disabled={saving}
                                style={{
                                    padding: '8px 16px',
                                    background: '#4CAF50',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    opacity: saving ? 0.6 : 1
                                }}
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                disabled={saving}
                                style={{
                                    padding: '8px 16px',
                                    background: '#f44336',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    opacity: saving ? 0.6 : 1
                                }}
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            style={{
                                padding: '8px 16px',
                                background: '#2196F3',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Edit
                        </button>
                    )}
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