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
        setUserEProducts();
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

// Display the products the user owns, if they are buyers
function setUserEProducts() {
  let userEProducts;
  if (userRole === 'buyer') {
    db.collection('buyers')
      .doc(userName)
      .get()
      .then((doc) => {
        userEProducts = doc.data().products ? doc.data().products : [];
        if (userEProducts.length == [].length) {
          $('#eProducts').empty();
          $('#eProducts').append(`
            <p>You currently don't own any items. You can go to the <a 
              class="link" href="./estore.html">E-Store</a> page to add some to 
              your cart and then, go to the <a class="link" 
              href="shoppingcart.html">Shopping Cart</a> to buy them.</p>
          `);
        } else {
          for (let i = 0; i < userEProducts.length; i++) {
            $('#eProducts').append(`
              <div class="card product-card" style="width: 18rem;">
                <div class="card-body">
                  <h5 class="card-title">${userEProducts[i].name}</h5>
                  <p class="card-text">${userEProducts[i].description}</p>
                  <p class="card-text">Price: ${userEProducts[
                    i
                  ].price.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  })}</p>
                </div>
              </div>
              <div class="product-card" style="width: 15px;"></div>
            `);
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
  } else {
    db.collection('regulator')
      .doc('products')
      .get()
      .then((doc) => {
        let allProducts = doc.data().products;
        let allProductsKeys = Object.keys(allProducts);
        let allProductsValues = Object.values(allProducts);
        console.log(allProductsKeys)
        console.log(allProductsValues)
        for (let i = 0; i < allProductsKeys[i].length; i++) {
          if (allProductsKeys[i] === userName) {
            for (let j = 0; j < allProductsValues.length; j++) {
              $('#eProducts').append(`
                <div class="card product-card" style="width: 18rem;">
                  <div class="card-body">
                    <h5 class="card-title">${allProductsValues[i].name}</h5>
                    <p class="card-text">${allProductsValues[i].description}</p>
                    <p class="card-text">Price: </p>
                  </div>
                </div>
                <div class="product-card" style="width: 15px;"></div>
              `);
            }
            break;
          }
        }
      });
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
