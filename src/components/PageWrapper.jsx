import React from 'react';

const PageWrapper = ({ children }) => {
    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            background: 'linear-gradient(135deg, #e3f0ff 0%, #f9fafc 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
        }}>
            <div style={{
                minHeight: 'calc(100vh - 60px)',
                width: '100%',
                maxWidth: 1200,
                margin: '0 auto',
                padding: 32,
                background: 'rgba(255,255,255,0.97)', // White background with 97% transparency
                borderRadius: 16,
                boxShadow: '0 6px 32px rgba(0,0,0,0.10)', // Subtle shadow
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                overflowY: 'auto',
                paddingBottom: 100
            }}>
                {children}
            </div>
        </div>
    );
};

export default PageWrapper;