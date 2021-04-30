// Table sorting configuration
let sortingConfig = [false, false, false, false, false];
let currentUser;

// Listen for authentication status changes
auth.onAuthStateChanged((user) => {
  if (user) {
    db.collection('users')
      .doc(auth.currentUser.uid)
      .get()
      .then((loggedUser) => {
        $('#companyName').text(loggedUser.data().name);
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

// Make the sales chart when the document is ready
$(document).on(
  'ready',
  (function () {
    ('use strict');

    feather.replace();

    // Graphs
    let salesGraph = $('#salesChart');

    // eslint-disable-next-line no-unused-vars
    new Chart(salesGraph, {
      type: 'line',
      data: {
        labels: [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ],
        datasets: [
          {
            data: [125, 157, 138, 166, 160, 165, 120],
            lineTension: 0,
            backgroundColor: 'transparent',
            borderColor: '#007bff',
            borderWidth: 4,
            pointBackgroundColor: '#007bff',
          },
        ],
      },
      options: {
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: false,
              },
            },
          ],
        },
        legend: {
          display: false,
        },
        animation: false,
      },
      plugins: {
        beforeDraw: function (chart, easing) {
          var ctx = chart.chart.ctx;
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, chart.width, chart.height);
          ctx.restore();
        },
      },
    });

    history.scrollRestoration = 'manual';
  })()
);

// Sign out
$('#sign-out-btn').on('click', () => {
  auth.signOut();
  window.location.href = '../index.html';
});
