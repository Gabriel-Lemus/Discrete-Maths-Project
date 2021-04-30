// Helper objects
let user = {};

// Listen for authentication status changes
auth.onAuthStateChanged((user) => {
  if (user) {
    window.location.href = './estore.html';
  }
});

// DOM components
const spinner = $('#login-spinner');
let rememberUser = $('#rememberMe').is(':checked');

// Enable tooltips with Popper.js
$(() => {
  $('[data-toggle="tooltip"]').tooltip();
});

// Toggle remember me checkbox value
$('#rememberMe').on('click', () => {
  rememberUser = $('#rememberMe').is(':checked');
});

// Toggle password visibility
$('#toggle-password-visibility').on('click', (event) => {
  event.preventDefault();
  if ($('#passwordLogin').attr('type') == 'password') {
    $('#passwordLogin').attr('type', 'text');
    $('#eye-icon').removeClass('fa-eye-slash');
    $('#eye-icon').addClass('fa-eye');
  } else {
    $('#passwordLogin').attr('type', 'password');
    $('#eye-icon').removeClass('fa-eye');
    $('#eye-icon').addClass('fa-eye-slash');
  }
});

// Reset form
function resetLoginForm() {
  if (user.status === 'Incorrect password') {
    $('#passwordLogin').val('');
    $('#passwordLogin').trigger('focus');
  } else {
    $('#emailAddressLogin').val('');
    $('#passwordLogin').val('');
    $('#emailAddressLogin').trigger('focus');
  }

  user.status = '';
  spinner.css('display', 'none');
}

// Reset form when user clicks off the modal
$('#loginModal').on('hidden.bs.modal', resetLoginForm);

// Login
$('#log-in-form').on('submit', (event) => {
  event.preventDefault();
  spinner.css('display', 'block');

  // Get user info
  const email = $('#log-in-form').find('input[name="email"]').val();
  const password = $('#log-in-form').find('input[name="password"]').val();

  if (rememberUser) {
    auth
      .signInWithEmailAndPassword(email, password)
      .then(() => {
        user.email = auth.currentUser.email;
        user.status = 'Logged in';
        window.location.href = './estore.html';
        spinner.css('display', 'none');
      })
      .catch((error) => {
        $('h5.modal-title').html('An error ocurred!');
        if (
          error.message ===
          'The password is invalid or the user does not have a password.'
        ) {
          user.status = 'Incorrect password';
          $('div.modal-body > p').text(
            'Your password is incorrect. Please re-enter your password.'
          );
        } else if (
          error.message ===
          'There is no user record corresponding to this identifier. The user may have been deleted.'
        ) {
          $('div.modal-body > p').text(
            "We couldn't find a user associated with this email address. Please make sure your credentials are correct."
          );
        } else if (
          error.message ===
          'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.'
        ) {
          $('div.modal-body > p').append(
            '<p>There have been many failed attempts to log in with your account. You can immediately restore it by <a class="link-primary" href="./forgot-password.html">resetting your password</a> or you can try again later.</p>'
          );
        } else {
          $('div.modal-body > p').text(
            'Something went wrong. Please re-enter your information.'
          );
          console.log(error);
        }
        $('#loginModal').modal();
      });
  } else {
    auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).then(() => {
      auth
        .signInWithEmailAndPassword(email, password)
        .then(() => {
          user.email = auth.currentUser.email;
          user.status = 'Logged in';
          window.location.href = './estore.html';
          spinner.css('display', 'none');
        })
        .catch((error) => {
          $('h5.modal-title').html('An error ocurred!');
          if (
            error.message ===
            'The password is invalid or the user does not have a password.'
          ) {
            user.status = 'Incorrect password';
            $('div.modal-body > p').text(
              'Your password is incorrect. Please re-enter your password.'
            );
          } else if (
            error.message ===
            'There is no user record corresponding to this identifier. The user may have been deleted.'
          ) {
            $('div.modal-body > p').text(
              "We couldn't find a user associated with this email address. Please make sure your credentials are correct."
            );
          } else if (
            error.message ===
            'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.'
          ) {
            $('div.modal-body > p').append(
              '<p>There have been many failed attempts to log in with your account. You can immediately restore it by <a class="link-primary" href="./forgot-password.html">resetting your password</a> or you can try again later.</p>'
            );
          } else {
            $('div.modal-body > p').text(
              'Something went wrong. Please re-enter your information.'
            );
            console.log(error);
          }
          $('#loginModal').modal();
        });
    });
  }
});
