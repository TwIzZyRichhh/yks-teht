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

// only the fields that were changed get sent
type UserUpdate = {username?: string; email?: string};

const updateUser = (update: UserUpdate) => {
  const token = localStorage.getItem(TOKEN_KEY);
  return fetchData(apiUrl + '/users', {
    method: 'PUT',
    headers: {...json, Authorization: `Bearer ${token}`},
    body: JSON.stringify(update),
  });
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

  const profileDialog =
    document.querySelector<HTMLDialogElement>('#profile-dialog');
  const openProfileBtn =
    document.querySelector<HTMLButtonElement>('#open-profile');
  const closeProfileBtn =
    document.querySelector<HTMLButtonElement>('#close-profile');
  const profileForm = document.querySelector<HTMLFormElement>('#profile-form');
  const profileMessage =
    document.querySelector<HTMLParagraphElement>('#profile-message');

  if (
    !dialog || !openBtn || !closeBtn || !logoutBtn || !userInfo ||
    !message || !loginForm || !registerForm || !profileDialog ||
    !openProfileBtn || !closeProfileBtn || !profileForm || !profileMessage
  ) {
    throw new Error('Auth elements not found');
  }

  let currentUser: User | null = null;

  const showUser = (user: User | null) => {
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

  // --- profile ---
  openProfileBtn.addEventListener('click', () => {
    if (!currentUser) return;
    profileMessage.textContent = '';
    // fill the form with the current details
    (profileForm.elements.namedItem('username') as HTMLInputElement).value =
      currentUser.username;
    (profileForm.elements.namedItem('email') as HTMLInputElement).value =
      currentUser.email;
    profileDialog.showModal();
  });
  closeProfileBtn.addEventListener('click', () => profileDialog.close());

  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(profileForm);
    const update: UserUpdate = {};

    const username = data.get('username') as string;
    const email = data.get('email') as string;

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
    } catch (err) {
      profileMessage.style.color = '#b00020';
      profileMessage.textContent = `Update failed: ${(err as Error).message}`;
    }
  });

  // restore session on page load
  showUser(await getCurrentUser());
};

export {initAuth, getCurrentUser, logout};
