var currencies = [ 'AUD', 'BRL', 'CAD', 'CHF', 'CLP', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 
'INR', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PKR', 'PLN', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'TWD', 'USD', 'ZAR' ];

var currency = 'USD';
if (localStorage.currency) {
  currency = localStorage.currency;
}
var api = 'coinmarketcap';
var adaType = 'balance';
/*if (localStorage.adaType) {
  adaType = localStorage.adaType;
}*/
var valueRefreshWorker = new Worker('./valueRefreshWorker.js');
var autoRefresh = localStorage.autoRefresh;

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

function getWalletBalance(address, cb) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    var balance = JSON.parse(xhr.responseText);
    cb(balance.Right.caBalance.getCoin / 1000000);
  }
  xhr.open('GET', `https://cardanoexplorer.com/api/addresses/summary/${address}`);
  xhr.responseType = 'text';
  xhr.send();
}

function refreshValueDisplay(api_source) {
  $('#ada-value-input').val('');
  $('#ada-value-input').removeClass('is-valid');
  $('#current-value').html('...');
  document.title = '... - How much is my ADA worth?';
  getAdaValue(api_source, currency, function(value) {
    $('#current-value').html(`${value} ${currency}`);
    if (adaType === 'address') {
      getWalletBalance($('#ada').val(), function(balance) {
        calculateAdaValue(api_source, currency, balance);
      });
    }
    else {
      calculateAdaValue(api_source, currency, 0);
    }
  });

  if (adaType === 'balance') {
    var adaBalance = parseInt($('#ada').val().replace(',', ''));
    var balanceString = isNaN(adaBalance) ? '' : `${adaBalance} `;
  }
  else {
    getWalletBalance($('#ada').val(), function(balance) {
      $('#ada-balance').html(`${balance} `);
    });
  }
}

function calculateAdaValue(api_source, currency, wallet_balance) {
  var ada;
  if (adaType === 'balance') {
    ada = $('#ada').val().replace(',', '');
  }
  else {
    ada = wallet_balance;
  }
  var value = ada * data[api_source].getPrice(currency);
  var decimalFixedValue = ((value *= 1000000) - (value % 1)) / 1000000;
  var valueString = decimalFixedValue > 0 ? decimalFixedValue : '';
  $('#ada-value-input').val(valueString);
  document.title = `${valueString} - How much is my ADA worth?`;
  if (decimalFixedValue > 0) {
    $('#ada-value-input').addClass('is-valid');
  }
  else {
    $('#ada-value-input').removeClass('is-valid');
  }
  localStorage.ada = ada;
}

function renderAdaType() {
  if (adaType === 'balance') {
    $('#ada-type-icon').attr('data', './ada-symbol-smallest-dark.inline.svg');
    $('#toggle-ada-type').html('<small>Use wallet address instead</small>');
    $('#ada').attr('placeholder', 'How much is in your wallet?');
  }
  else {
    $('#ada-type-icon').attr('data', './wallet-ic.inline.svg');
    $('#toggle-ada-type').html('<small>Use wallet balance instead</small>');
    $('#ada').attr('placeholder', 'What\'s your wallet address?');
  }
}

$(function() {

  if (localStorage.ada) {
    $('#ada').val(localStorage.ada);
  }
  if (localStorage.autoRefresh) {
    valueRefreshWorker.postMessage({ command: 'start-auto-refresh' });
    $('#auto-refresh').prop('checked', true);
  }
  refreshValueDisplay(api);
  renderAdaType();
  renderCurrencyDisplay(currency);
  $('#currency').change(function() {
    currency = currencies[$(this)[0].selectedIndex];
    localStorage.currency = currency;
    refreshValueDisplay(api);
  });
  $('#refresh-price').click(function() { refreshValueDisplay(api); });
  valueRefreshWorker.onmessage = function(e) {
    if (e.data.command === 'refresh') {
      refreshValueDisplay(api);
    }
  };
  $('#auto-refresh').change(function() {
    if ($(this).prop('checked')) {
      valueRefreshWorker.postMessage({ command: 'start-auto-refresh' });
      localStorage.autoRefresh = true;
    }
    else {
      valueRefreshWorker.postMessage({ command: 'stop-auto-refresh' });
      localStorage.autoRefresh = false;
    }
  });
  $('#ada').keyup(function() {
    try {
      if (adaType === 'balance') {
        calculateAdaValue(api, currency, 0);
        var adaBalance = parseInt($('#ada').val().replace(',', ''));
        $('#ada-balance').html(isNaN(adaBalance) ? '' : `${adaBalance} `);
      }
      else {
        getWalletBalance($('#ada').val(), function(balance) {
          calculateAdaValue(api, currency, balance);
          $('#ada-balance').html(`${balance} `);
        });
      }
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
  $('#toggle-ada-type').click(function() {
    if (adaType === 'address') {
      adaType = 'balance';
    }
    else {
      adaType = 'address';
    }
    renderAdaType();
    localStorage.adaType = adaType;
  });

});
