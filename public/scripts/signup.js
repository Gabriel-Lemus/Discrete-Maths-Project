// Node RSA package
const NodeRSA = require('node-rsa');

// Enable RSA key generation in the browser window
window.NodeRSA = (bits) => {
  return new NodeRSA({ b: bits });
};

// Enable buffer creation
window.Buffer = (data) => {
  return Buffer.from(data);
};

// Helper objects
const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// Assume user has been created
let assumeUserIsCreated = true;

// DOM components
const spinner = $('#signup-spinner');

// Sign up status
let signUpStatus = null;

// Toggle password visibility
$('#toggle-password-visibility').on('click', (event) => {
  event.preventDefault();
  if ($('#passwordSignUp').attr('type') == 'password') {
    $('#passwordSignUp').attr('type', 'text');
    $('#eye-icon').removeClass('fa-eye-slash');
    $('#eye-icon').addClass('fa-eye');
  } else {
    $('#passwordSignUp').attr('type', 'password');
    $('#eye-icon').removeClass('fa-eye');
    $('#eye-icon').addClass('fa-eye-slash');
  }
});

// Toggle password confirmation visibility
$('#toggle-password-visibility-2').on('click', (event) => {
  event.preventDefault();
  if ($('#confirmPasswordSignUp').attr('type') == 'password') {
    $('#confirmPasswordSignUp').attr('type', 'text');
    $('#eye-icon-2').removeClass('fa-eye-slash');
    $('#eye-icon-2').addClass('fa-eye');
  } else {
    $('#confirmPasswordSignUp').attr('type', 'password');
    $('#eye-icon-2').removeClass('fa-eye');
    $('#eye-icon-2').addClass('fa-eye-slash');
  }
});

// Reset form when user clicks off the modal
$('#signUpModal').on('hidden.bs.modal', resetSignUpForm);

// Reset form
function resetSignUpForm() {
  if (signUpStatus == 'Existing email') {
    $('#emailAddress').val('');
    $('#emailAddress').trigger('focus');
  } else if (signUpStatus == 'Existing company') {
    $('#company').val('');
    $('#company').trigger('focus');
  } else if (signUpStatus == 'Weak password') {
    $('#passwordSignUp').val('');
    $('#confirmPasswordSignUp').val('');
    $('#passwordSignUp').trigger('focus');
  } else {
    $('#confirmPasswordSignUp').val('');
    $('#confirmPasswordSignUp').trigger('focus');
  }

  signUpStatus = null;
  spinner.css('display', 'none');
}

// Sign up
$('#sign-up-form').on('submit', (event) => {
  event.preventDefault();
  assumeUserIsCreated = false;
  window.scrollTo(0, document.body.scrollHeight);
  spinner.css('display', 'block');

  // Hide passwords if they are not already hidden
  if ($('#passwordSignUp').attr('type') == 'text') {
    $('#passwordSignUp').attr('type', 'password');
    $('#eye-icon').removeClass('fa-eye');
    $('#eye-icon').addClass('fa-eye-slash');
  }

  if ($('#confirmPasswordSignUp').attr('type') == 'text') {
    $('#confirmPasswordSignUp').attr('type', 'password');
    $('#eye-icon-2').removeClass('fa-eye');
    $('#eye-icon-2').addClass('fa-eye-slash');
  }

  // Get user info
  const firstName = $('#sign-up-form').find('input[name="firstName"]').val();
  const lastName = $('#sign-up-form').find('input[name="lastName"]').val();
  const nit = parseInt($('#nit').val());
  const role = $('#selectRole').val();
  const email = $('#sign-up-form').find('input[name="email"]').val();
  const password = $('#sign-up-form').find('input[name="password"]').val();
  const psswdConf = $('#sign-up-form').find('input[name="passwordConf"]').val();

  let availableEmail = true;

  // Check if email is not already associated to another account
  db.collection('users')
    .where('email', '==', email)
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        if (doc.data().email == email) {
          // The requested email is associated with an existing account
          availableEmail = false;
          signUpStatus = 'Existing email';
        }
      });
      // The email is associated with an account; tell the user
      if (!availableEmail) {
        $('h5.modal-title').html('Email is already in use.');
        $('div.modal-body > p').text(
          `The email you entered is associated with an existing account.
                Please use another email.`
        );
        $('#signUpModal').modal();
      } else {
        // Check if passwords match
        if (password === psswdConf) {
          let userName = `${firstName} ${lastName}`;
          let userData = {
            name: userName,
            email: email,
            nit: nit,
            role: role,
          };

          // RSA key-pairs generation
          const pkcsType = 'pkcs8';
          const pkcsSize = 1024;

          const keys = new NodeRSA({ b: pkcsSize });
          keys.setOptions({ encryptionScheme: 'pkcs1' });

          const publicKeyPem = keys.exportKey(pkcsType + '-public-pem');
          const privateKeyPem = keys.exportKey(pkcsType + '-private-pem');

          let verifiableUserData = '';
          for (const [key, value] of Object.entries(userData)) {
            verifiableUserData += `${key}: ${value} `;
          }
          verifiableUserData = verifiableUserData.trim();

          const privateKey = new NodeRSA({ b: pkcsSize });
          privateKey.importKey(privateKeyPem, pkcsType + '-private-pem');

          const publicKey = new NodeRSA({ b: pkcsSize });
          publicKey.importKey(publicKeyPem, pkcsType + '-public-pem');

          const signedData = privateKey
            .sign(Buffer.from(verifiableUserData), 'base64')
            .toString('base64');

          const isSignedDataVerified = publicKey.verify(
            Buffer.from(verifiableUserData),
            signedData,
            'buffer',
            'base64'
          );

          // Verify if signed data matches
          if (isSignedDataVerified) {
            db.collection('regulator')
              .doc('regulatorPrivateKey')
              .get()
              .then((doc) => {
                // Authorization certificate creation
                let today = new Date();
                let expirationDate = new Date(
                  today.getFullYear() + 5,
                  today.getMonth() + 1,
                  today.getDate()
                );
                const regulatorPrivateKeyStr = doc.data().privateKey;
                const regulatorPrivateKey = new NodeRSA(regulatorPrivateKeyStr);
                const certificate = `The regulator hereby certifies that ${userName}, identified with the NIT ${nit} has been accepted as a ${role}, with the public key ${publicKeyPem}. Expiration date ${expirationDate}`;
                const signedCertificate = regulatorPrivateKey
                  .sign(Buffer.from(certificate), 'base64')
                  .toString('base64');

                // Sign up user
                auth
                  .createUserWithEmailAndPassword(email, password)
                  .then((credential) => {
                    // Add user to the auth collection
                    db.collection('users')
                      .doc(credential.user.uid)
                      .set({
                        name: userName,
                        email: email,
                        role: role,
                        nit: nit,
                        certificate: signedCertificate,
                        certificateExpirationDate: firebase.firestore.Timestamp.fromDate(
                          new Date(
                            `${
                              monthNames[expirationDate.getMonth()]
                            } ${expirationDate.getDate()}, ${expirationDate.getFullYear()}`
                          )
                        ),
                      })
                      .then(() => {
                        console.log('Done!');
                        // Set user display name
                        auth.currentUser
                          .updateProfile({
                            displayName: userName,
                          })
                          .then(() => {
                            if (role === 'buyer') {
                              // Add user data to the buyers' collection
                              db.collection('buyers')
                                .doc(userName)
                                .set({
                                  name: userName,
                                  email: email,
                                  nit: nit,
                                  balance: 1000,
                                  privateKey: privateKeyPem,
                                  publicKey: publicKeyPem,
                                  certificate: signedCertificate,
                                  certificateExpirationDate: firebase.firestore.Timestamp.fromDate(
                                    new Date(
                                      `${
                                        monthNames[expirationDate.getMonth()]
                                      } ${expirationDate.getDate()}, ${expirationDate.getFullYear()}`
                                    )
                                  ),
                                })
                                .then(() => {
                                  db.collection('regulator')
                                    .doc('publicKeys')
                                    .get()
                                    .then((doc) => {
                                      let buyersPublicKeys = doc.data().buyers;
                                      buyersPublicKeys[userName] = {
                                        publicKey: publicKeyPem,
                                      };
                                      db.collection('regulator')
                                        .doc('publicKeys')
                                        .update({
                                          buyers: buyersPublicKeys,
                                        })
                                        .then(() => {
                                          auth.signOut().then(() => {
                                            auth
                                              .signInWithEmailAndPassword(
                                                email,
                                                password
                                              )
                                              .then(() => {
                                                spinner.css('display', 'none');
                                                window.location.href =
                                                  './estore.html';
                                              });
                                          });
                                        })
                                        .catch((error) => {
                                          console.log(error);
                                        });
                                    })
                                    .catch((error) => {
                                      console.log(error);
                                    });
                                })
                                .catch((error) => {
                                  console.log(error);
                                });
                            } else {
                              // Add user data to the sellers' collection
                              db.collection('sellers')
                                .doc(userName)
                                .set({
                                  name: userName,
                                  email: email,
                                  nit: nit,
                                  profit: 0,
                                  privateKey: privateKeyPem,
                                  publicKey: publicKeyPem,
                                  certificate: signedCertificate,
                                  certificateExpirationDate: firebase.firestore.Timestamp.fromDate(
                                    new Date(
                                      `${
                                        monthNames[expirationDate.getMonth()]
                                      } ${expirationDate.getDate()}, ${expirationDate.getFullYear()}`
                                    )
                                  ),
                                })
                                .then(() => {
                                  db.collection('regulator')
                                    .doc('publicKeys')
                                    .get()
                                    .then((doc) => {
                                      let sellersPublicKeys = doc.data()
                                        .sellers;
                                      sellersPublicKeys[userName] = {
                                        publicKey: publicKeyPem,
                                      };
                                      db.collection('regulator')
                                        .doc('publicKeys')
                                        .update({
                                          sellers: sellersPublicKeys,
                                        })
                                        .then(() => {
                                          auth.signOut().then(() => {
                                            auth
                                              .signInWithEmailAndPassword(
                                                email,
                                                password
                                              )
                                              .then(() => {
                                                spinner.css('display', 'none');
                                                window.location.href =
                                                  './estore.html';
                                              });
                                          });
                                        })
                                        .catch((error) => {
                                          console.log(error);
                                        });
                                    })
                                    .catch((error) => {
                                      console.log(error);
                                    });
                                })
                                .catch((error) => {
                                  console.log(error);
                                });
                            }
                          })
                          .catch((error) => {
                            console.log(error);
                          });
                      })
                      .catch((error) => {
                        console.log(error);
                      });
                  })
                  .catch((error) => {
                    if (
                      error.message ===
                      'The email address is already in use by another account.'
                    ) {
                      signUpStatus = 'Existing email';
                      $('h5.modal-title').html('Email is already in use.');
                      $('div.modal-body > p').text(
                        `The email you entered is associated with an existing account.
                        Please use another email.`
                      );
                      $('#signUpModal').modal();
                    } else if (
                      error.message ===
                      'Password should be at least 6 characters'
                    ) {
                      signUpStatus = 'Weak password';
                      $('h5.modal-title').html('Weak password.');
                      $('div.modal-body > p').text(
                        'Your password should be at least 6 characters.'
                      );
                      $('#signUpModal').modal();
                    } else {
                      console.log(error);
                    }
                  });
              })
              .catch((error) => {
                console.log(error);
              });
          } else {
            signUpStatus = 'Passwords do not match';
            $('h5.modal-title').html('Passwords do not match.');
            $('div.modal-body > p').text(`
            The passwords you entered do not match.
            Please make sure they match.
          `);
            $('#signUpModal').modal();
          }
        }
      }
    })
    .catch((error) => {
      console.log(error);
    });
});
