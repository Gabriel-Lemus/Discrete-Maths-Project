// Listen for authentication status changes
auth.onAuthStateChanged((user) => {
  if (user) {
    window.location.href = './pages/estore.html';
  }
});
