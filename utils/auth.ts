
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    NextOrObserver,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { auth } from './firebase';

export const logIn = (email: string, password: string): Promise<User> => {
    return signInWithEmailAndPassword(auth, email, password).then(userCredential => userCredential.user);
};

export const logOut = (): Promise<void> => {
    return signOut(auth);
};

export const onAuthStateChange = (callback: NextOrObserver<User>): (() => void) => {
    return onAuthStateChanged(auth, callback);
};

export const signInWithGoogle = async (): Promise<User> => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    return result.user;
};
