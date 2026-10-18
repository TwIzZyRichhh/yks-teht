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
const updateUser = (update) => {
    const token = localStorage.getItem(TOKEN_KEY);
    return fetchData(apiUrl + '/users', {
        method: 'PUT',
        headers: { ...json, Authorization: `Bearer ${token}` },
        body: JSON.stringify(update),
    });
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
    const profileDialog = document.querySelector('#profile-dialog');
    const openProfileBtn = document.querySelector('#open-profile');
    const closeProfileBtn = document.querySelector('#close-profile');
    const profileForm = document.querySelector('#profile-form');
    const profileMessage = document.querySelector('#profile-message');
    if (!dialog || !openBtn || !closeBtn || !logoutBtn || !userInfo ||
        !message || !loginForm || !registerForm || !profileDialog ||
        !openProfileBtn || !closeProfileBtn || !profileForm || !profileMessage) {
        throw new Error('Auth elements not found');
    }
    let currentUser = null;
    const showUser = (user) => {
        currentUser = user;
        userInfo.textContent = user ? `Logged in as ${user.username}` : '';
        openBtn.hidden = !!user;
        openProfileBtn.hidden = !user;
        logoutBtn.hidden = !user;
    };
    // --- login / register ---
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
    // --- profile ---
    openProfileBtn.addEventListener('click', () => {
        if (!currentUser)
            return;
        profileMessage.textContent = '';
        // fill the form with the current details
        profileForm.elements.namedItem('username').value =
            currentUser.username;
        profileForm.elements.namedItem('email').value =
            currentUser.email;
        profileDialog.showModal();
    });
    closeProfileBtn.addEventListener('click', () => profileDialog.close());
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = new FormData(profileForm);
        const update = {};
        const username = data.get('username');
        const email = data.get('email');
        // only send what actually changed
        if (currentUser && username !== currentUser.username) {
            update.username = username;
        }
        if (currentUser && email !== currentUser.email) {
            update.email = email;
        }
        if (Object.keys(update).length === 0) {
            profileMessage.style.color = '#b00020';
            profileMessage.textContent = 'Nothing to update';
            return;
        }
        try {
            await updateUser(update);
            // fetch the saved details from the server so the page shows the real values
            const user = await getCurrentUser();
            showUser(user);
            profileMessage.style.color = 'green';
            profileMessage.textContent = 'Details updated!';
        }
        catch (err) {
            profileMessage.style.color = '#b00020';
            profileMessage.textContent = `Update failed: ${err.message}`;
        }
    });
    // restore session on page load
    showUser(await getCurrentUser());
};
export { initAuth, getCurrentUser, logout };
