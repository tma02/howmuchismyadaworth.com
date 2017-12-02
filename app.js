var currencies = [ 'AUD', 'BRL', 'CAD', 'CHF', 'CLP', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 
'INR', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PKR', 'PLN', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'TWD', 'USD', 'ZAR' ];

var currency = 'USD';
if (localStorage.currency) {
  currency = localStorage.currency;
}
var api = 'coinmarketcap';

var data = {
  coinmarketcap: {
    api_source: 'coinmarketcap',
    url: 'https://api.coinmarketcap.com/v1/ticker/cardano/?convert=',
    loaded: false,
    data: [],
    onPriceUpdate: function() {

    },
    getPrice: function(currency) {
      return this.data[0][`price_${currency.toLowerCase()}`];
    }
  },
};

function renderCurrencyDisplay(selected_currency) {
  $('#currency').html('');
  for (var i = 0; i < currencies.length; i++) {
    var selected = currencies[i] === selected_currency;
    $('#currency').append(`<option${selected ? ' selected' : ''}>${currencies[i]}</option>`);
  }
}

function getAdaValue(api_source, currency, cb) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    data[api_source].data = JSON.parse(xhr.responseText);
    data[api_source].loaded = true;
    console.log(data[api_source].getPrice(currency));
    cb(data[api_source].getPrice(currency));
  }
  xhr.open('GET', `${data[api_source].url}${currency}`);
  xhr.responseType = 'text';
  xhr.send();
}

function refreshValueDisplay(api_source) {
  $('#ada-value-input').val('');
  $('#ada-value-input').removeClass('is-valid');
  $('#current-value').html('...');
  getAdaValue(api_source, currency, function(value) {
    $('#current-value').html(`${value} ${currency}`);
    calculateAdaValue(api_source, currency);
  });
}

function calculateAdaValue(api_source, currency) {
  var ada = $('#ada').val().replace(',', '');
  var value = ada * data[api_source].getPrice(currency);
  var decimalFixedValue = ((value *= 1000000) - (value % 1)) / 1000000;
  $('#ada-value-input').val(decimalFixedValue > 0 ? decimalFixedValue : '');
  if (decimalFixedValue > 0) {
    $('#ada-value-input').addClass('is-valid');
  }
  else {
    $('#ada-value-input').removeClass('is-valid');
  }
  localStorage.ada = ada;
}

$(function() {

  if (localStorage.ada) {
    $('#ada').val(localStorage.ada);
  }
  refreshValueDisplay(api);
  renderCurrencyDisplay(currency);
  $('#currency').change(function() {
    currency = currencies[$(this)[0].selectedIndex];
    localStorage.currency = currency;
    refreshValueDisplay(api);
  });
  $('#refresh-price').click(function() { refreshValueDisplay(api); });
  $('#ada').keyup(function() {
    try {
      calculateAdaValue(api, currency);
    }
    catch (e) {
      console.log(e);
      $('#ada-value-input').val('');
      $('#ada-value-input').removeClass('is-valid');
    }
  });
  $('#about').click(function() {
    if ($('.about-container').hasClass('about-slide-down')) {
      $('.about-container').removeClass('about-slide-down');
      setTimeout(function() {
        $('.about-container').addClass('about-slide-up');
      }, 1);
      $('#about').html('About');
    }
    else {
      $('.about-container').removeClass('about-slide-up');
      setTimeout(function() {
        $('.about-container').addClass('about-slide-down');
      }, 1);
      $('#about').html('Close');
    }
  });

});
