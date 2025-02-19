import { createAuthConfig } from '../src/auth';
import { Logger } from '../src/types';
import { readFileSync } from 'fs';

jest.mock('fs');

describe('createAuthConfig', () => {
    const mockLogger: Logger = {
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn()
    };

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should return token auth config when accessToken is provided', () => {
        const accessToken = 'token';
        const config = createAuthConfig({
            accessToken,
            logger: mockLogger,
        });

        expect(config).toEqual({
            authStrategy: undefined,
            auth: accessToken,
        });
    });

    it('should throw an error when accessToken is missing', () => {
        expect(() => {
            createAuthConfig({
                logger: mockLogger,
            });
        }).toThrow('You must specify a GitHub access token using the --access-token argument or GITHUB_TOKEN environment variable.');
    });

    it('should return installation auth config when required parameters are provided', () => {
        const appId = '12345';
        const privateKey = '-----BEGIN RSA PRIVATE KEY-----\nprivate-key\n-----END RSA PRIVATE KEY-----';
        const appInstallationId = '67890';
        const config = createAuthConfig({
            appId,
            privateKey,
            appInstallationId,
            logger: mockLogger,
        });

        expect(config).toEqual({
            authStrategy: expect.any(Function),
            auth: {
                appId: parseInt(appId),
                privateKey,
                installationId: parseInt(appInstallationId),
            },
        });
    });

    it('should throw an error when appId is missing', () => {
        const privateKey = 'private-key';
        const appInstallationId = '67890';

        expect(() => {
            createAuthConfig({
                privateKey,
                appInstallationId,
                logger: mockLogger,
            });
        }).toThrow('You must specify a GitHub app ID using the --app-id argument or GITHUB_APP_ID environment variable.');
    });

    it('should throw an error when privateKey is missing', () => {
        const appId = '12345';
        const appInstallationId = '67890';

        expect(() => {
            createAuthConfig({
                appId,
                appInstallationId,
                logger: mockLogger,
            });
        }).toThrow('You must specify a GitHub app private key using the --private-key argument, --private-key-file argument, GITHUB_APP_PRIVATE_KEY_FILE environment variable, or GITHUB_APP_PRIVATE_KEY environment variable.');
    });

    it('should return token auth config when accessToken is provided via environment variable', () => {
        process.env.GITHUB_TOKEN = 'env-token';
        const config = createAuthConfig({
            logger: mockLogger,
        });

        expect(config).toEqual({
            authStrategy: undefined,
            auth: 'env-token',
        });
        delete process.env.GITHUB_TOKEN;
    });

    it('should return installation auth config when required parameters are provided via environment variables', () => {
        process.env.GITHUB_APP_ID = '12345';
        process.env.GITHUB_APP_PRIVATE_KEY = '-----BEGIN RSA PRIVATE KEY-----\nprivate-key\n-----END RSA PRIVATE KEY-----';
        process.env.GITHUB_APP_INSTALLATION_ID = '67890';
        delete process.env.GITHUB_TOKEN; // Ensure no access token is set
        const config = createAuthConfig({
            logger: mockLogger,
        });

        expect(config).toEqual({
            authStrategy: expect.any(Function),
            auth: {
                appId: 12345,
                privateKey: '-----BEGIN RSA PRIVATE KEY-----\nprivate-key\n-----END RSA PRIVATE KEY-----',
                installationId: 67890,
            },
        });
        delete process.env.GITHUB_APP_ID;
        delete process.env.GITHUB_APP_PRIVATE_KEY;
        delete process.env.GITHUB_APP_INSTALLATION_ID;
    });

    it('should return installation auth config when privateKey is provided as a file path', () => {
        (readFileSync as jest.Mock).mockReturnValue('file-private-key');

        const appId = '12345';
        const privateKeyFile = '/path/to/private-key-file.pem';
        const appInstallationId = '67890';
        const config = createAuthConfig({
            appId,
            privateKeyFile,
            appInstallationId,
            logger: mockLogger,
        });

        expect(config).toEqual({
            authStrategy: expect.any(Function),
            auth: {
                appId: parseInt(appId),
                privateKey: 'file-private-key',
                installationId: parseInt(appInstallationId),
            },
        });
    });

    it('should return installation auth config when privateKeyFile is provided', () => {
        (readFileSync as jest.Mock).mockReturnValue('file-private-key');

        const appId = '12345';
        const privateKeyFile = '/path/to/private-key-file.pem';
        const appInstallationId = '67890';
        const config = createAuthConfig({
            appId,
            privateKeyFile,
            appInstallationId,
            logger: mockLogger,
        });

        expect(config).toEqual({
            authStrategy: expect.any(Function),
            auth: {
                appId: parseInt(appId),
                privateKey: 'file-private-key',
                installationId: parseInt(appInstallationId),
            },
        });
    });

    it('should return installation auth config when privateKeyFile is provided via environment variable', () => {
        (readFileSync as jest.Mock).mockReturnValue('file-private-key');
        process.env.GITHUB_APP_PRIVATE_KEY_FILE = '/path/to/private-key-file.pem';

        const appId = '12345';
        const appInstallationId = '67890';
        const config = createAuthConfig({
            appId,
            appInstallationId,
            logger: mockLogger,
        });

        expect(config).toEqual({
            authStrategy: expect.any(Function),
            auth: {
                appId: parseInt(appId),
                privateKey: 'file-private-key',
                installationId: parseInt(appInstallationId),
            },
        });
        delete process.env.GITHUB_APP_PRIVATE_KEY_FILE;
    });

    it('should throw an error when privateKey and privateKeyFile are both missing', () => {
        const appId = '12345';
        const appInstallationId = '67890';

        expect(() => {
            createAuthConfig({
                appId,
                appInstallationId,
                logger: mockLogger,
            });
        }).toThrow('You must specify a GitHub app private key using the --private-key argument, --private-key-file argument, GITHUB_APP_PRIVATE_KEY_FILE environment variable, or GITHUB_APP_PRIVATE_KEY environment variable.');
    });
});