import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from './firebase';

export interface FileUploadResult {
    url: string;
    name: string;
    type: string;
    size: number;
    path: string;
}

export const uploadFile = async (file: File, taskId: string): Promise<FileUploadResult> => {
    const filePath = `attachments/${taskId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);
    
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);

    return {
        url,
        name: file.name,
        type: file.type,
        size: file.size,
        path: filePath,
    };
};

export const deleteFile = async (filePath: string): Promise<void> => {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
};
