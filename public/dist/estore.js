// Helper objects
let sellersNames = null;
let sellerGoods = null;

// Listen for authentication status changes
auth.onAuthStateChanged((user) => {
  if (user) {
    db.collection('users')
      .doc(auth.currentUser.uid)
      .get()
      .then((loggedUser) => {
        $('#companyName').text(loggedUser.data().name);
        db.collection('regulator').onSnapshot((querySnapshot) => {
          sellersNames = [];
          sellerGoods = [];
          const eGoods = querySnapshot.docs[0].data().products;
          for (const [key, value] of Object.entries(eGoods)) {
            sellersNames.push(key);
            sellerGoods.push({
              seller: key,
              products: value,
            });
          }
          if (loggedUser.data().role === 'buyer') {
            setEProducts(sellersNames, sellerGoods);
          } else {
            displaySellerMenu();
          }
        });
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

// Display the e-products
function setEProducts(sellers, products) {
  $('#eProducts').empty();
  if (sellers.length !== [].length && products.length !== [].length) {
    for (let i = 0; i < sellers.length; i++) {
      $('#eProducts').append(`
        <h6>${sellers[i]}</h6>
        <div id="${sellers[i].replace(/ /g, '')}-products"></div>
        <br />
      `);
      for (let j = 0; j < products[i].products.length; j++) {
        let sellerName = sellers[i];
        $(`
          <div class="card product-card" style="width: 18rem;">
            <div class="card-body">
              <h5 class="card-title">${products[i].products[j].name}</h5>
              <p class="card-text">${products[i].products[j].description}</p>
              <p class="card-text">Price: ${products[i].products[
                j
              ].price.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
              })}</p>
              <a onclick="addToCart(${i}, ${j})" class="btn btn-primary">Add to cart</a>
            </div>
          </div>
          <div class="product-card" style="width: 15px"></div>
        `).appendTo(`#${sellers[i].replace(/ /g, '')}-products`);
      }
    }
  } else {
    $('#eProducts').empty();
    $('#eProducts').text(
      'We are sorry for the inconveniences, but there are currently no available items.'
    );
  }
}

// Sellers cannot buy, so they are invited to go to the products page
function displaySellerMenu() {
  $('#eProducts').append(`
    <p>We are sorry for the inconviences, but you cannot buy products as a seller in the cryptosystem.</p>
    <p>You can go to the <a class="link" href="./product-registration.html">product registration</a> page so you can add some of your products to sell.</p>
  `);
}

// Add to cart
function addToCart(sellerIndex, productIndex) {
  cart.push({
    seller: sellersNames[sellerIndex],
    eGood: sellerGoods[sellerIndex].products[productIndex],
  });
}

// Make the sales chart when the document is ready
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
