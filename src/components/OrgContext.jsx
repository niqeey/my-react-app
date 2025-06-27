import React, { createContext, useContext, useState } from 'react';

const OrgContext = createContext();

export const OrgProvider = ({ children }) => {
    const [orgId, setOrgId] = useState(null);
    const [username, setUsername] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [sessionExpiryTime, setSessionExpiryTime] = useState(null);

    return (
        <OrgContext.Provider value={{
            orgId, setOrgId,
            username, setUsername,
            sessionId, setSessionId,
            sessionExpiryTime, setSessionExpiryTime
        }}>
            {children}
        </OrgContext.Provider>
    );
};

export const useOrg = () => useContext(OrgContext);