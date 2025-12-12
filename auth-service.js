/**
 * Unbeed - Auth Service
 * Simulates an Authentication Provider (like Firebase Auth)
 */

class AuthService {
    constructor() {
        this.user = this.loadUser();
        this.listeners = [];
    }

    // Load user from local storage (persistence)
    loadUser() {
        const stored = localStorage.getItem('unbeed_user');
        return stored ? JSON.parse(stored) : null;
    }

    // Login (Simulated Google Auth)
    async login() {
        return new Promise((resolve) => {
            // Simulate network delay
            setTimeout(() => {
                this.user = {
                    uid: 'user_' + Date.now(),
                    displayName: 'Unbeed User',
                    photoURL: 'https://ui-avatars.com/api/?name=Unbeed+User&background=F59E0B&color=000',
                    email: 'user@example.com'
                };
                localStorage.setItem('unbeed_user', JSON.stringify(this.user));
                this.notifyListeners();
                resolve(this.user);
            }, 800);
        });
    }

    // Logout
    logout() {
        this.user = null;
        localStorage.removeItem('unbeed_user');
        this.notifyListeners();
    }

    // Current User
    currentUser() {
        return this.user;
    }

    // Require Login (Gatekeeper)
    // Returns true if logged in, otherwise triggers login flow
    // In a real app, this would show a proper modal
    async requireLogin(message = "Please sign in to contribute.") {
        if (this.user) return true;

        const confirmLogin = confirm(`${message}\n\nWould you like to sign in mock-style?`);
        if (confirmLogin) {
            await this.login();
            return true;
        }
        return false;
    }

    // Subscribe to auth state changes
    onAuthStateChanged(callback) {
        this.listeners.push(callback);
        callback(this.user); // Initial state
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    notifyListeners() {
        this.listeners.forEach(l => l(this.user));
    }
}

// Export singleton
const authService = new AuthService();
