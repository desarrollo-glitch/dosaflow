
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    NextOrObserver,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { auth } from './firebase';

export const signUp = (email: string, password: string): Promise<User> => {
    return createUserWithEmailAndPassword(auth, email, password).then(userCredential => userCredential.user);
};

export const logIn = (email: string, password: string): Promise<User> => {
    return signInWithEmailAndPassword(auth, email, password).then(userCredential => userCredential.user);
};

export const logOut = (): Promise<void> => {
    return signOut(auth);
};

export const onAuthStateChange = (callback: NextOrObserver<User>): (() => void) => {
    return onAuthStateChanged(auth, callback);
};

export const signInWithGoogle = (): Promise<User> => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider).then(result => result.user);
};
