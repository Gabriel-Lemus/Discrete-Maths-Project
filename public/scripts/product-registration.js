const NodeRSA = require('node-rsa');
const SHA256 = require('crypto-js/sha256');

// User role
let userRole;

// Enable the SHA256 function on the browser window
window.SHA256 = (data) => {
  return SHA256(data).toString();
};

window.generateRSA = (bits) => {
  return new NodeRSA({ b: bits });
};

// Listen for authentication status changes
auth.onAuthStateChanged((user) => {
  if (user) {
    db.collection('users')
      .doc(auth.currentUser.uid)
      .get()
      .then((loggedUser) => {
        $('#companyName').text(loggedUser.data().name);
        userRole = loggedUser.data().role;
        setProductRegistrationMenu();
      })
      .catch((error) => {
        console.log(error);
      });
    setTimeout(() => {
      $('#inventory-spinner').css('display', 'none');
      $('#body-blurred').attr('id', 'body');
    }, 1125);
  }
});

// Display the product registration menu for sellers
function setProductRegistrationMenu() {
  if (userRole === 'seller') {
    $('#eProducts').append(`
      <button id="registerProduct" class="btn btn-primary">Register New Product</button>
    `);

    // Display modal form to register the new e-product
    $('#registerProduct').on('click', () => {
      $('#productsRgModal').modal();
    });

    // Register product
    $('#register-product-form').on('submit', (event) => {
      event.preventDefault();
      $('#registerEProduct').html('');
      $('#registerEProduct').append(`
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Register E-Product
      `);
      $('#registerEProduct').prop('disabled', true);

      // Product data
      const productName = $('#productName').val();
      const productPrice = parseFloat($('#price').val());
      const productDesc = $('#description').val();

      // Get the user private key
      let userPrivateKey;
      let userPublicKey;
      db.collection('users')
        .doc(auth.currentUser.uid)
        .get()
        .then((userDoc) => {
          db.collection('sellers')
            .doc(userDoc.data().name)
            .get()
            .then((userInfo) => {
              userPrivateKey = new NodeRSA(userInfo.data().privateKey);
              userPublicKey = new NodeRSA(userInfo.data().publicKey);
              // Product Hash
              const productHash = SHA256(
                `Product = { Name: ${productName} - Price: ${productPrice} - Description: ${productDesc}}`
              );

              const signedHash = userPrivateKey
                .sign(Buffer.from(productHash.toString()), 'base64')
                .toString('base64');

              const isSignedHashVerified = userPublicKey
                .verify(
                  Buffer.from(productHash.toString()),
                  signedHash,
                  'buffer',
                  'base64'
                )
                .toString('base64');

              if (isSignedHashVerified) {
                db.collection('regulator')
                  .doc('products')
                  .get()
                  .then((doc) => {
                    let products = doc.data().products;
                    let sellersNames = Object.keys(products);
                    let sellersProducts = Object.values(products);
                    let currentUserProducts = [];
                    for (let i = 0; i < sellersNames.length; i++) {
                      if (sellersNames[i] === userInfo.data().name) {
                        currentUserProducts = sellersProducts[i];
                        break;
                      }
                    }
                    products[userInfo.data().name] = currentUserProducts.concat(
                      [
                        {
                          description: productDesc,
                          name: productName,
                          price: productPrice,
                          signedHash: signedHash,
                          hash: productHash.toString(),
                        },
                      ]
                    );
                    db.collection('regulator')
                      .doc('products')
                      .update({
                        products: products,
                      })
                      .then(() => {
                        $('#productName').val('');
                        $('#price').val('');
                        $('#description').val('');
                        $('#registerEProduct').html('');
                        $('#registerEProduct').append('Add item');
                        $('#registerEProduct').prop('disabled', false);
                        $('#productsRgModal').modal('hide');
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
    });
  } else {
    $('#eProducts').append(`
      <p>We are sorry, but only the users registered as sellers can register products.</p>
    `);
  }
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
  window.location.href = '../index.html';
});
