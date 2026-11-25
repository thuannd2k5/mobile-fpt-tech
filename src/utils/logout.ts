interface LogoutSteps {
    revoke: () => Promise<unknown>;
    clear: () => Promise<void>;
    reset: () => void;
}

export async function logoutSession({ revoke, clear, reset }: LogoutSteps): Promise<void> {
    try {
        await revoke();
    } catch {
        // An unavailable server must not prevent signing out on this device.
    }
    await clear();
    reset();
}
