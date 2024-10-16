/// <reference types="vite-plugin-pwa/client" />

import {fetchData} from './functions';
import {UpdateResult} from './interfaces/UpdateResult';
import {UploadResult} from './interfaces/UploadResult';
import {LoginUser, UpdateUser, User} from './interfaces/User';
import {apiUrl, uploadUrl} from './variables';
import {registerSW} from 'virtual:pwa-register';

// PWA-koodi
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Uutta sisältöä saatavilla. Ladataanko uudelleen?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('Sovellus on valmis toimimaan offline-tilassa.');
  },
});

// Valitse DOM-elementit
const loginButton = document.querySelector(
  '#login-button'
) as HTMLButtonElement;
const loginDialog = document.querySelector('#login-dialog') as HTMLDivElement;
const closeLoginDialogButton = document.querySelector(
  '#close-login-dialog'
) as HTMLSpanElement;

// Näytä kirjautumisdialogi
loginButton.addEventListener('click', () => {
  loginDialog.style.display = 'block';
});

// Piilota kirjautumisdialogi
closeLoginDialogButton.addEventListener('click', () => {
  loginDialog.style.display = 'none';
});

window.addEventListener('click', (event) => {
  if (event.target === loginDialog) {
    loginDialog.style.display = 'none';
  }
});

// Valitse lomakkeet ja syötekentät
const loginForm = document.querySelector('#login-form') as HTMLFormElement;
const profileForm = document.querySelector('#profile-form') as HTMLFormElement;
const avatarForm = document.querySelector('#avatar-form') as HTMLFormElement;
const avatarInput = document.querySelector('#avatar') as HTMLInputElement;
const usernameInput = document.querySelector('#username') as HTMLInputElement;
const passwordInput = document.querySelector('#password') as HTMLInputElement;
const profileUsernameInput = document.querySelector(
  '#profile-username'
) as HTMLInputElement;
const profileEmailInput = document.querySelector(
  '#profile-email'
) as HTMLInputElement;
const usernameTarget = document.querySelector(
  '#username-target'
) as HTMLElement;
const emailTarget = document.querySelector('#email-target') as HTMLElement;
const avatarTarget = document.querySelector(
  '#avatar-target'
) as HTMLImageElement;

// Funktio kirjautumiseen
const login = async (): Promise<void> => {
  const username = usernameInput.value;
  const password = passwordInput.value;

  const loginData = {
    username: username,
    password: password,
  };

  try {
    const response = await fetchData<LoginUser>(
      `${apiUrl}/auth/login`,
      'POST',
      loginData
    );

    if (response.token) {
      localStorage.setItem('token', response.token);

      // Käytä käyttäjätietoja
      const user = response.data;
      addUserDataToDom(user);
      loginDialog.style.display = 'none';
    }
  } catch (error) {
    console.error('Kirjautuminen epäonnistui:', error);
  }
};

// Funktio käyttäjätietojen päivittämiseen
const updateUserData = async (
  user: UpdateUser,
  token: string
): Promise<void> => {
  try {
    const response = await fetchData<UpdateResult>(
      `${apiUrl}/users`,
      'PUT',
      user,
      token
    );
    addUserDataToDom(response.data);
  } catch (error) {
    console.error('Käyttäjätietojen päivitys epäonnistui:', error);
  }
};

// Funktio käyttäjätietojen lisäämiseksi DOM:iin
const addUserDataToDom = (user: User): void => {
  usernameTarget.textContent = user.username;
  emailTarget.textContent = user.email;
  avatarTarget.src = user.avatar
    ? `${uploadUrl}/${user.avatar}`
    : 'default-avatar.png';
  profileUsernameInput.value = user.username;
  profileEmailInput.value = user.email;
};

// Funktio avatarin lataamiseen
const uploadAvatar = async (file: File, token: string): Promise<void> => {
  const formData = new FormData();
  formData.append('avatar', file);

  try {
    await fetchData<UploadResult>(
      `${apiUrl}/users/avatar`,
      'POST',
      formData,
      token
    );
    const user = await getUserData(token);
    addUserDataToDom(user);
  } catch (error) {
    console.error('Avatarin lataus epäonnistui:', error);
  }
};

// Funktio tokenin tarkistamiseen
const checkToken = async (): Promise<void> => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const user = await getUserData(token);
      addUserDataToDom(user);
    } catch (error) {
      console.error('Käyttäjätietojen haku epäonnistui:', error);
    }
  } else {
    console.log('Tokenia ei löytynyt.');
  }
};

// Funktio käyttäjätietojen hakemiseen
const getUserData = async (token: string): Promise<User> => {
  try {
    return await fetchData<User>(
      `${apiUrl}/users/token`,
      'GET',
      undefined,
      token
    );
  } catch (error) {
    console.error('Käyttäjätietojen haku epäonnistui:', error);
    throw error;
  }
};

// Avatar-lomakkeen tapahtumankuuntelija esikatselulle ja lataukselle
avatarInput.addEventListener('change', () => {
  const file = avatarInput.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (avatarTarget) {
        avatarTarget.src = e.target?.result as string;
      }
    };
    reader.readAsDataURL(file);
  }
});

if (avatarForm) {
  avatarForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const token = localStorage.getItem('token');
    const file = avatarInput.files?.[0];

    if (token && file) {
      await uploadAvatar(file, token);
    } else {
      console.error('Tokenia ei löytynyt tai tiedostoa ei valittu.');
    }
  });
}

// Kirjautumislomakkeen tapahtumankuuntelija
if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await login();
  });
}

// Profiililomakkeen tapahtumankuuntelija
if (profileForm) {
  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const token = localStorage.getItem('token');
    if (token) {
      const updatedUserData: UpdateUser = {
        username: profileUsernameInput.value,
        email: profileEmailInput.value,
      };
      await updateUserData(updatedUserData, token);
    } else {
      console.error('Tokenia ei löytynyt. Kirjaudu sisään.');
    }
  });
}

// Sivun latautuessa
checkToken();
