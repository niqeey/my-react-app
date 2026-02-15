import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PageWrapper from './PageWrapper';

describe('PageWrapper Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        sessionStorage.clear();
    });

    const renderPageWrapper = (children = <div>Test Content</div>) => {
        return render(
            <BrowserRouter>
                <PageWrapper>{children}</PageWrapper>
            </BrowserRouter>
        );
    };

    test('should render children content', () => {
        renderPageWrapper(<div>Test Content</div>);
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    test('should apply outer div styling', () => {
        const { container } = renderPageWrapper(<div>Test Content</div>);
        const outerDiv = container.querySelector('div');
        const styles = window.getComputedStyle(outerDiv);
        expect(styles.minHeight).toBe('100vh');
        expect(styles.width).toBe('100vw');
    });

    test('should wrap content with proper styling', () => {
        const { container } = renderPageWrapper(<div>Test Content</div>);
        // Get the inner container div (direct child of outer div)
        const innerDiv = container.querySelector('div > div');
        expect(innerDiv).toBeInTheDocument();
        // Check that it has the expected structure
        expect(innerDiv.style.minHeight).toBeTruthy();
    });

    test('should render multiple children', () => {
        renderPageWrapper(
            <>
                <div>First Child</div>
                <div>Second Child</div>
            </>
        );
        expect(screen.getByText('First Child')).toBeInTheDocument();
        expect(screen.getByText('Second Child')).toBeInTheDocument();
    });
});
