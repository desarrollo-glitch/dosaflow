// Lightweight Google Drive picker helper intentionally kept dependency-free.
// Requires the host app to provide a Google API key and OAuth Client ID via environment variables.

// We don't ship type definitions for gapi/google picker to keep bundling simple.
declare const gapi: any;
declare const google: any;

declare global {
    interface Window {
        google: any;
    }
}

const GAPI_SRC = 'https://apis.google.com/js/api.js';
const GSI_SRC = 'https://accounts.google.com/gsi/client';
const DRIVE_SCOPES = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.file',
];

export interface DriveFileMetadata {
    id: string;
    name: string;
    mimeType?: string;
    url: string;
    iconUrl?: string;
}

const loadScript = (src: string): Promise<void> => new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`No se pudo cargar el script ${src}`));
    document.body.appendChild(script);
});

const loadPickerApi = async () => {
    await loadScript(GAPI_SRC);
    if (!gapi?.picker) {
        await new Promise<void>((resolve, reject) => {
            gapi.load('picker', () => resolve());
            setTimeout(() => reject(new Error('Timeout cargando Google Picker')), 10000);
        });
    }
};

const loadGsiClient = async () => {
    await loadScript(GSI_SRC);
    if (!window.google || !window.google.accounts?.oauth2) {
        throw new Error('No se pudo inicializar Google Identity Services');
    }
};

const requestDriveToken = async (clientId: string): Promise<string> => {
    await loadGsiClient();
    return new Promise((resolve, reject) => {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: DRIVE_SCOPES.join(' '),
            callback: (response: any) => {
                if (response.error || !response.access_token) {
                    reject(new Error(response.error || 'No se obtuvo token de Drive'));
                } else {
                    resolve(response.access_token);
                }
            },
        });
        tokenClient.requestAccessToken({ prompt: 'consent' });
    });
};

export const pickDriveFile = async (params: { apiKey: string; clientId: string; }): Promise<DriveFileMetadata> => {
    const { apiKey, clientId } = params;
    await loadPickerApi();
    const token = await requestDriveToken(clientId);

    return new Promise<DriveFileMetadata>((resolve, reject) => {
        const view = new google.picker.DocsView()
            .setIncludeFolders(true)
            .setSelectFolderEnabled(false);

        const picker = new google.picker.PickerBuilder()
            .enableFeature(google.picker.Feature.SUPPORT_DRIVES)
            .setDeveloperKey(apiKey)
            .setOAuthToken(token)
            .addView(view)
            .setCallback((data: any) => {
                if (data.action === google.picker.Action.PICKED) {
                    const doc = data.docs?.[0];
                    if (!doc) {
                        reject(new Error('No se recibió el archivo de Drive'));
                        return;
                    }
                    const url = doc.url || `https://drive.google.com/file/d/${doc.id}/view?usp=sharing`;
                    resolve({
                        id: doc.id,
                        name: doc.name,
                        mimeType: doc.mimeType,
                        url,
                        iconUrl: doc.iconUrl,
                    });
                } else if (data.action === google.picker.Action.CANCEL) {
                    reject(new Error('Selección cancelada'));
                }
            })
            .setSize(900, 600)
            .build();

        picker.setVisible(true);
    });
};
