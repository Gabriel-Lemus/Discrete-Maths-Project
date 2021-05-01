const NodeRSA = require('node-rsa');
const SHA256 = require('crypto-js/sha256');

// Helper objects
let userRole;
let userName;

// Listen for authentication status changes
auth.onAuthStateChanged((user) => {
  if (user) {
    db.collection('users')
      .doc(auth.currentUser.uid)
      .get()
      .then((loggedUser) => {
        $('#companyName').text(loggedUser.data().name);
        userName = loggedUser.data().name;
        userRole = loggedUser.data().role;
        displayCartProducts();
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

// List cart products
function displayCartProducts() {
  if (userRole === 'buyer') {
    const productsCart = JSON.parse(window.localStorage.getItem('cart'));
    if (Boolean(JSON.parse(window.localStorage.getItem('cart')))) {
      // Cart has e-products
      $('#buyProducts').remove();
      $('#emptyCart').remove();
      $('#eProducts').empty();
      $('#productsHeader').append(`
        <button id="buyProducts" class="btn btn-primary">
          Buy E-Products
        </button>
        <button id="emptyCart" class="btn btn-warning">
          Empty Cart
        </button>
      `);

      // Buy products cart
      $('#buyProducts').on('click', () => {
        $('#buyProducts').html('');
        $('#buyProducts').append(`
          <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          Buy E-Products
        `);
        $('#buyProducts').prop('disabled', true);

        let purchase = [];
        for (let i = 0; i < productsCart.length; i++) {
          let seller = productsCart[i].seller;
          let eProduct = productsCart[i].eGood;
          let eProductKeys = Object.keys(eProduct);
          let eProductValues = Object.values(eProduct);

          let productDesc;
          let productHash;
          let productName;
          let productPrice;
          let productSignedHash;

          for (let j = 0; j < eProductKeys.length; j++) {
            if (eProductKeys[j] === 'description') {
              productDesc = eProductValues[j];
            } else if (eProductKeys[j] === 'hash') {
              productHash = eProductValues[j];
            } else if (eProductKeys[j] === 'name') {
              productName = eProductValues[j];
            } else if (eProductKeys[j] === 'price') {
              productPrice = eProductValues[j];
            } else if (eProductKeys[j] === 'signedHash') {
              productSignedHash = eProductValues[j];
            }
          }
          purchase.push({
            seller: seller,
            name: productName,
            description: productDesc,
            price: productPrice,
            hash: productHash,
            signedHash: productSignedHash,
          });
        }
        let purchaseTotal = 0;
        for (let i = 0; i < purchase.length; i++) {
          purchaseTotal += purchase[i].price;
          let profit = purchase[i].price;
          db.collection('sellers')
            .doc(purchase[i].seller)
            .get()
            .then((doc) => {
              profit += doc.data().profit;
              db.collection('sellers')
                .doc(purchase[i].seller)
                .update({
                  profit: profit,
                })
                .then(() => {})
                .catch((error) => {
                  console.log(error);
                });
            })
            .catch((error) => {
              console.log(error);
            });
        }
        let balance = 0;
        db.collection('buyers')
          .doc(userName)
          .get()
          .then((doc) => {
            balance += doc.data().balance;
            db.collection('buyers')
              .doc(userName)
              .update({
                balance: balance - purchaseTotal,
              })
              .then(() => {})
              .catch((error) => {
                console.log(error);
              });
          })
          .catch((error) => {
            console.log(error);
          });
        let currentUserProducts = [];
        db.collection('buyers')
          .doc(userName)
          .get()
          .then((doc) => {
            currentUserProducts = doc.data().products
              ? doc.data().products
              : [];
            db.collection('buyers')
              .doc(userName)
              .update({
                products: currentUserProducts.concat(purchase),
              })
              .then(() => {
                $('#buyProducts').html('');
                $('#buyProducts').append('Purchase E-Products');
                $('#buyProducts').prop('disabled', false);
                window.localStorage.removeItem('cart');
                location.reload();
              })
              .catch((error) => {
                console.log(error);
              });
          })
          .catch((error) => {
            console.log(error);
          });
      });

      // Delete the products in the cart
      $('#emptyCart').on('click', () => {
        window.localStorage.removeItem('cart');
        location.reload();
      });

      for (let i = 0; i < productsCart.length; i++) {
        let seller = productsCart[i].seller;
        let eProduct = productsCart[i].eGood;
        let eProductKeys = Object.keys(eProduct);
        let eProductValues = Object.values(eProduct);

        let productDesc;
        let productHash;
        let productName;
        let productPrice;
        let productSignedHash;

        for (let j = 0; j < eProductKeys.length; j++) {
          if (eProductKeys[j] === 'description') {
            productDesc = eProductValues[j];
          } else if (eProductKeys[j] === 'hash') {
            productHash = eProductValues[j];
          } else if (eProductKeys[j] === 'name') {
            productName = eProductValues[j];
          } else if (eProductKeys[j] === 'price') {
            productPrice = eProductValues[j];
          } else if (eProductKeys[j] === 'signedHash') {
            productSignedHash = eProductValues[j];
          }
        }
        $('#eProducts').append(`
          <div class="card product-card" style="width: 18rem;">
            <div class="card-body">
              <h5 class="card-title">${productName}</h5>
              <p class="card-text">${productDesc}</p>
              <p class="card-text">Price: $${productPrice
                .toString()
                .toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                })}</p>
            </div>
          </div>
          <div class="product-card" style="width: 15px"></div>
        `);
      }
    } else {
      // Cart is empty
      $('#eProducts').append(`
        <p>You need to add items to your cart before buying them. You can do so by browsing the available items in the <a class="link" href="./estore.html">E-Store</a> page, and selecting the ones you like the most.</p>
      `);
    }
  } else {
    $('#eProducts').append(`
      <p>We are sorry, but only the users registered as buyers can access their shopping cart to purchase items.</p>
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
  window.localStorage.removeItem('cart');
});
