type SessionListener = () => void;
const listeners = new Set<SessionListener>();

export const onSessionExpired = (listener: SessionListener) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
};

export const notifySessionExpired = () => {
    listeners.forEach((listener) => listener());
};
