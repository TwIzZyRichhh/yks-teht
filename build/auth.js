import { fetchData } from './functions.js';
import { apiUrl } from './variables.js';
const TOKEN_KEY = 'token';
const json = { 'Content-Type': 'application/json' };
const register = (username, email, password) => fetchData(apiUrl + '/users', {
    method: 'POST',
    headers: json,
    body: JSON.stringify({ username, email, password }),
});
const login = async (username, password) => {
    const res = await fetchData(apiUrl + '/auth/login', {
        method: 'POST',
        headers: json,
        body: JSON.stringify({ username, password }),
    });
    localStorage.setItem(TOKEN_KEY, res.token);
    return res.data;
};
const getCurrentUser = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token)
        return null;
    try {
        return await fetchData(apiUrl + '/users/token', {
            headers: { Authorization: `Bearer ${token}` },
        });
    }
    catch {
        localStorage.removeItem(TOKEN_KEY); // expired or invalid token
        return null;
    }
};
const logout = () => localStorage.removeItem(TOKEN_KEY);
// ---------- UI ----------
const initAuth = async () => {
    console.log('Initializing auth...');
    const dialog = document.querySelector('#auth-dialog');
    const openBtn = document.querySelector('#open-auth');
    const closeBtn = document.querySelector('#close-auth');
    const logoutBtn = document.querySelector('#logout');
    const userInfo = document.querySelector('#user-info');
    const message = document.querySelector('#auth-message');
    const loginForm = document.querySelector('#login-form');
    const registerForm = document.querySelector('#register-form');
    if (!dialog || !openBtn || !closeBtn || !logoutBtn || !userInfo ||
        !message || !loginForm || !registerForm) {
        throw new Error('Auth elements not found');
    }
    const showUser = (user) => {
        userInfo.textContent = user ? `Logged in as ${user.username}` : '';
        openBtn.hidden = !!user;
        logoutBtn.hidden = !user;
    };
    openBtn.addEventListener('click', () => {
        message.textContent = '';
        dialog.showModal();
    });
    closeBtn.addEventListener('click', () => dialog.close());
    logoutBtn.addEventListener('click', () => {
        logout();
        showUser(null);
    });
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = new FormData(loginForm);
        try {
            const user = await login(data.get('username'), data.get('password'));
            showUser(user);
            loginForm.reset();
            dialog.close();
        }
        catch (err) {
            message.textContent = `Login failed: ${err.message}`;
        }
    });
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = new FormData(registerForm);
        const username = data.get('username');
        const password = data.get('password');
        try {
            await register(username, data.get('email'), password);
            // log in straight after registering
            const user = await login(username, password);
            showUser(user);
            registerForm.reset();
            dialog.close();
        }
        catch (err) {
            message.textContent = `Registration failed: ${err.message}`;
        }
    });
    // restore session on page load
    showUser(await getCurrentUser());
};
export { initAuth, getCurrentUser, logout };
