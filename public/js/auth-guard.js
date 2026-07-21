// Global Authentication Guard

function initAuthGuard() {
  const isLoginPage = window.location.pathname.includes('/login.html');

  if (typeof firebaseAuth !== 'undefined' && firebaseAuth) {
    firebaseAuth.onAuthStateChanged(async (user) => {
      
      if (!user) {
        // Not logged in
        if (!isLoginPage) {
          // Redirect to login if trying to access a protected page
          window.location.replace('/login.html');
        }
      } else {
        // Logged in
        if (isLoginPage) {
          // Already logged in, no need to see login page
          window.location.replace('/');
        } else {
          // We are on a protected page. Update UI.
          updateNavbarForAuthenticatedUser(user);
          
          // Get the real JWT token and save it to localStorage so api.js can use it
          const token = await user.getIdToken();
          const session = { uid: user.uid, email: user.email, name: user.displayName, token };
          localStorage.setItem('fb_mock_session', JSON.stringify(session)); // Kept same key so api.js doesn't break
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // If firebase is already ready
  if (window.firebaseAuth) {
    initAuthGuard();
  } else {
    window.addEventListener('firebaseReady', initAuthGuard);
  }
});

function updateNavbarForAuthenticatedUser(user) {
  // Find the Sign In button in navbar and change it to Sign Out
  const signInBtn = document.querySelector('.btn-signin-pill') || document.querySelector('a[href="/login.html"]');
  if (signInBtn) {
    signInBtn.textContent = 'Sign Out';
    signInBtn.href = '#';
    signInBtn.onclick = (e) => {
      e.preventDefault();
      localStorage.removeItem('fb_mock_session');
      firebaseAuth.signOut();
    };
  }
}
