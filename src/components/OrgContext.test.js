import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { OrgProvider, useOrg } from './OrgContext';

// Test component to use OrgContext
const TestComponent = () => {
    const { orgId, setOrgId, username, setUsername } = useOrg();
    
    return (
        <div>
            <div data-testid="orgId">{orgId || 'No OrgId'}</div>
            <div data-testid="username">{username || 'No Username'}</div>
            <button onClick={() => setOrgId('org456')}>Set OrgId</button>
            <button onClick={() => setUsername('Test User')}>Set Username</button>
        </div>
    );
};

describe('OrgContext', () => {
    const renderWithContext = () => {
        return render(
            <BrowserRouter>
                <OrgProvider>
                    <TestComponent />
                </OrgProvider>
            </BrowserRouter>
        );
    };

    test('should provide default values', () => {
        renderWithContext();
        
        expect(screen.getByTestId('orgId')).toHaveTextContent('No OrgId');
        expect(screen.getByTestId('username')).toHaveTextContent('No Username');
    });

    test('should update orgId when setOrgId is called', async () => {
        renderWithContext();
        
        const button = screen.getByRole('button', { name: /Set OrgId/i });
        button.click();
        
        await waitFor(() => {
            expect(screen.getByTestId('orgId')).toHaveTextContent('org456');
        });
    });

    test('should update username when setUsername is called', async () => {
        renderWithContext();
        
        const button = screen.getByRole('button', { name: /Set Username/i });
        button.click();
        
        await waitFor(() => {
            expect(screen.getByTestId('username')).toHaveTextContent('Test User');
        });
    });

    test('should provide context to nested components', () => {
        const NestedComponent = () => {
            const { orgId } = useOrg();
            return <div data-testid="nested-orgId">{orgId || 'No OrgId'}</div>;
        };

        render(
            <BrowserRouter>
                <OrgProvider>
                    <NestedComponent />
                </OrgProvider>
            </BrowserRouter>
        );
        
        expect(screen.getByTestId('nested-orgId')).toHaveTextContent('No OrgId');
    });
});
