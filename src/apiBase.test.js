import apiBase from './apiBase';

describe('apiBase', () => {
    test('should export API base URL', () => {
        expect(apiBase).toBeDefined();
        expect(typeof apiBase).toBe('string');
    });

    test('should be a valid URL format', () => {
        expect(apiBase).toMatch(/^https?:\/\//);
    });

    test('should not have trailing slash', () => {
        expect(apiBase).not.toMatch(/\/$/);
    });

    test('should contain protocol and domain', () => {
        const urlPattern = /^https?:\/\/[a-zA-Z0-9.-]+(:[0-9]+)?$/;
        expect(apiBase).toMatch(urlPattern);
    });
});
