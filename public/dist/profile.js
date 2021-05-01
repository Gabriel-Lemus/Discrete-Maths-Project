// Redirect to home page if not signed in
auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = '/public';
  } else {
    db.collection('users')
      .doc(auth.currentUser.uid)
      .get()
      .then((loggedUser) => {
        $('#companyName').text(loggedUser.data().name);
        setUserProfile(loggedUser.data());
      })
      .catch((error) => {
        console.log(error);
      });
    setTimeout(() => {
      $('#profile-spinner').css('display', 'none');
      $('#body-blurred').attr('id', 'body');
    }, 1125);
  }
});

// Get date from seconds
function secondsToDate(secs) {
  var t = new Date(1970, 0, 1);
  t.setSeconds(secs);
  return t;
}

// Fill user profile data
function setUserProfile(userData) {
  const expDate = secondsToDate(userData.certificateExpirationDate.seconds);
  $('#userName').text(userData.name);
  $('#userEmail').text(userData.email);
  $('#nit').text(userData.nit);
  if (userData.role === 'buyer') {
    $('#role').text('Buyer');
    $('#balance').text('Funds');
    db.collection('buyers')
    .doc(userData.name)
    .get()
    .then((userInfo) => {
        $('#balanceValue').text(
          userInfo.data().balance.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
          })
        );
      })
      .catch((error) => {
        console.log(error);
      });
  } else {
    $('#role').text('Seller');
    $('#balance').text('Profit');
    db.collection('sellers')
      .doc(userData.name)
      .get()
      .then((userInfo) => {
        $('#balanceValue').text(
          userInfo.data().profit.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
          })
        );
      })
      .catch((error) => {
        console.log(error);
      });
  }
  $('#expDate').text(
    `${expDate.getMonth() + 1}/${expDate.getDate()}/${expDate.getFullYear()}`
  );
}

// Enable feather icons
$(document).on(
  'ready',
  (function () {
    ('use strict');
    feather.replace();
    history.scrollRestoration = 'manual';
  })()
);

// Sign out
$('#sign-out-btn').on('click', () => {
  auth.signOut();
  window.location.href = '../../index.html';
});

// Features not implemented
function notImplemented() {
  $('h5.modal-title').html('This feature has not been implemented yet.');
  $('div.modal-body > p').text(
    "We're sorry, we haven't implemented this action yet."
  );
  $('#niModal').modal();
}
