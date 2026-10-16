import {fetchData} from './functions.js';
import type {LoginResponse, User} from './types/users';
import {apiUrl} from './variables.js';

const TOKEN_KEY = 'token';

const json = {'Content-Type': 'application/json'};

const register = (username: string, email: string, password: string) =>
  fetchData<{message: string; data: User}>(apiUrl + '/users', {
    method: 'POST',
    headers: json,
    body: JSON.stringify({username, email, password}),
  });

const login = async (username: string, password: string) => {
  const res = await fetchData<LoginResponse>(apiUrl + '/auth/login', {
    method: 'POST',
    headers: json,
    body: JSON.stringify({username, password}),
  });
  localStorage.setItem(TOKEN_KEY, res.token);
  return res.data;
};

const getCurrentUser = async (): Promise<User | null> => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  try {
    return await fetchData<User>(apiUrl + '/users/token', {
      headers: {Authorization: `Bearer ${token}`},
    });
  } catch {
    localStorage.removeItem(TOKEN_KEY); // expired or invalid token
    return null;
  }
};

const logout = () => localStorage.removeItem(TOKEN_KEY);

// ---------- UI ----------
const initAuth = async () => {
  console.log('Initializing auth...');
  const dialog = document.querySelector<HTMLDialogElement>('#auth-dialog');
  const openBtn = document.querySelector<HTMLButtonElement>('#open-auth');
  const closeBtn = document.querySelector<HTMLButtonElement>('#close-auth');
  const logoutBtn = document.querySelector<HTMLButtonElement>('#logout');
  const userInfo = document.querySelector<HTMLSpanElement>('#user-info');
  const message = document.querySelector<HTMLParagraphElement>('#auth-message');
  const loginForm = document.querySelector<HTMLFormElement>('#login-form');
  const registerForm =
    document.querySelector<HTMLFormElement>('#register-form');

  if (!dialog || !openBtn || !closeBtn || !logoutBtn || !userInfo ||
      !message || !loginForm || !registerForm) {
    throw new Error('Auth elements not found');
  }

  const showUser = (user: User | null) => {
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
      const user = await login(
        data.get('username') as string,
        data.get('password') as string
      );
      showUser(user);
      loginForm.reset();
      dialog.close();
    } catch (err) {
      message.textContent = `Login failed: ${(err as Error).message}`;
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(registerForm);
    const username = data.get('username') as string;
    const password = data.get('password') as string;
    try {
      await register(username, data.get('email') as string, password);
      // log in straight after registering
      const user = await login(username, password);
      showUser(user);
      registerForm.reset();
      dialog.close();
    } catch (err) {
      message.textContent = `Registration failed: ${(err as Error).message}`;
    }
  });

  // restore session on page load
  showUser(await getCurrentUser());
};

export {initAuth, getCurrentUser, logout};
