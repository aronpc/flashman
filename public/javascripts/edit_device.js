
let renderEditErrors = function(errors) {
  for (let key in errors) {
    if (errors[key].messages.length > 0) {
      let message = '';
      errors[key].messages.forEach(function(msg) {
        message += msg + ' ';
      });
      $(errors[key].field).closest('.input-entry').find('.invalid-feedback').html(message);
      $(errors[key].field)[0].setCustomValidity(message);
    }
  }
};

var socket = io();
socket.on('LIVELOG', function (macaddr, data) {
  if(($('#analyse-logs').data('bs.modal') || {})._isShown){
    let id = $('#logRouterid_label').text();
    if(id == macaddr) {
      let textarea = $('#logArea');
      if(textarea.text() == 'Aguardando resposta do roteador...') {
        let usrtypes = ['user', 'daemon', 'kern', 'local1', 'authpriv', ];
        textarea.html('<code>'+pako.ungzip(data,{ to: 'string' })+'</code>');
        textarea.highlight(usrtypes.map(function(x){return x+'.warn';}), {element: 'strong', className: 'text-warning'});
        textarea.highlight(usrtypes.map(function(x){return x+'.err';}), {element: 'strong', className: 'text-danger'});
        textarea.highlight(usrtypes.map(function(x){return x+'.debug';}), {element: 'strong', className: 'text-info'});
      }    
    }
  }
});

let printLogData = function(url) {
  let textarea = $('#logArea');
  let id = $('#logRouterid_label').text();
  let usrtypes = ['user', 'daemon', 'kern', 'local1', 'authpriv', ];
  $.ajax({
    url: url + id,
    type: 'get',
    success: function(res, status, xhr) {
      let ct = xhr.getResponseHeader("content-type") || "";
      if (ct.indexOf('json') > -1) 
        textarea.html('ERRO: '+res.message);
      else {
        textarea.html('<code>'+res+'</code>');
        textarea.highlight(usrtypes.map(function(x){return x+'.warn';}), {element: 'strong', className: 'text-warning'});
        textarea.highlight(usrtypes.map(function(x){return x+'.err';}), {element: 'strong', className: 'text-danger'});
        textarea.highlight(usrtypes.map(function(x){return x+'.debug';}), {element: 'strong', className: 'text-info'});
      }
    },
    error: function(xhr, status, error) {
      textarea.html(status + ' ' + error);
    },
  });
};

let validateEditDevice = function(event) {
  $('.form-control').blur(); // Remove focus from form
  $('.edit-form input').each(function() {
    // Reset validation messages
    this.setCustomValidity('');
  });
  let validator = new Validator();

  let row = $(event.target).parents('tr');
  let index = row.data('index');

  // Get form values
  let mac = row.data('deviceid');
  let validateWifi = row.data('validateWifi');
  let validatePppoe = row.data('validatePppoe');
  let pppoe = $('#edit_connect_type-' + index.toString()).val() === 'PPPoE';
  let pppoeUser = $('#edit_pppoe_user-' + index.toString()).val();
  let pppoePassword = $('#edit_pppoe_pass-' + index.toString()).val();
  let pppoePassLength = row.data('minlengthPassPppoe');
  let ssid = $('#edit_wifi_ssid-' + index.toString()).val();
  let password = $('#edit_wifi_pass-' + index.toString()).val();
  let channel = $('#edit_wifi_channel-' + index.toString()).val();
  let externalReferenceType = $('#edit_ext_ref_type_selected-' +
                                index.toString()).html();
  let externalReferenceData = $('#edit_external_reference-' +
                                index.toString()).val();

  // Initialize error structure
  let errors = {
    pppoe_user: {field: '#edit_pppoe_user-' + index.toString()},
    pppoe_password: {field: '#edit_pppoe_pass-' + index.toString()},
    ssid: {field: '#edit_wifi_ssid-' + index.toString()},
    password: {field: '#edit_wifi_pass-' + index.toString()},
    channel: {field: '#edit_wifi_channel-' + index.toString()},
  };
  for (let key in errors) {
    if (Object.prototype.hasOwnProperty.call(errors, key)) {
      errors[key]['messages'] = [];
    }
  }

  let genericValidate = function(value, func, errors, minlength) {
    let validField = func(value, minlength);
    if (!validField.valid) {
      errors.messages = validField.err;
    }
  };

  // Validate fields
  if (pppoe && validatePppoe) {
    genericValidate(pppoeUser, validator.validateUser, errors.pppoe_user);
    genericValidate(pppoePassword, validator.validatePassword,
                    errors.pppoe_password, pppoePassLength);
  }
  if (validateWifi) {
    genericValidate(ssid, validator.validateSSID, errors.ssid);
    genericValidate(password, validator.validateWifiPassword, errors.password);
    genericValidate(channel, validator.validateChannel, errors.channel);
  }

  let hasNoErrors = function(key) {
    return errors[key].messages.length < 1;
  };

  if (Object.keys(errors).every(hasNoErrors)) {
    // If no errors present, send to backend
    let data = {'content': {
      'connection_type': (pppoe) ? 'pppoe' : 'dhcp',
      'external_reference': {
        kind: externalReferenceType,
        data: externalReferenceData,
      },
    }};
    if (validatePppoe) {
      data.content['pppoe_user'] = (pppoe) ? pppoeUser : '';
      data.content['pppoe_password'] = (pppoe) ? pppoePassword : '';
    }
    if (validateWifi) {
      data.content['wifi_ssid'] = ssid;
      data.content['wifi_password'] = password;
      data.content['wifi_channel'] = channel;
    }

    $.ajax({
      type: 'POST',
      url: '/devicelist/update/' + mac,
      dataType: 'json',
      data: JSON.stringify(data),
      contentType: 'application/json',
      success: function(resp) {
        location.reload();
      },
      error: function(xhr, status, error) {
        let resp = JSON.parse(xhr.responseText);
        if ('errors' in resp) {
          let keyToError = {
            pppoe_user: errors.pppoe_user,
            pppoe_password: errors.pppoe_password,
            ssid: errors.ssid,
            password: errors.password,
            channel: errors.channel,
          };
          resp.errors.forEach(function(pair) {
            let key = Object.keys(pair)[0];
            keyToError[key].messages.push(pair[key]);
          });
          renderEditErrors(errors);
        }
      },
    });
  } else {
    // Else, render errors on form
    renderEditErrors(errors);
  }
  return false;
};

$(document).ready(function() {
  $('.edit-form').submit(validateEditDevice);

  $('.btn-reboot').click(function(event) {
    let row = $(event.target).parents('tr');
    let id = row.data('deviceid');
    $.ajax({
      url: '/devicelist/command/' + id + '/boot',
      type: 'post',
      success: function(res) {
        let badge;
        if(res.success) {
          badge = $(event.target).closest('.actions-opts')
                                     .find('.badge-success');
        } else {
          badge = $(event.target).closest('.actions-opts')
                                     .find('.badge-warning');
          if(res.message)
            badge.text(res.message);
        }

        badge.show();
        setTimeout(function() {
          badge.hide();
        }, 1500);
      },
      error: function(xhr, status, error) {
        let badge = $(event.target).closest('.actions-opts')
                                   .find('.badge-warning');
        badge.text(status);
        badge.show();
        setTimeout(function() {
          badge.hide();
        }, 1500);
      },
    });
  });

  $('.btn-reset-app').click(function(event) {
    let row = $(event.target).parents('tr');
    let id = row.data('deviceid');
    $.ajax({
      url: '/devicelist/command/' + id + '/rstapp',
      type: 'post',
      dataType: 'json',
      success: function(res) {
        let badge;
        if(res.success) {
          badge = $(event.target).closest('.actions-opts')
                                     .find('.badge-success');
        } else {
          badge = $(event.target).closest('.actions-opts')
                                     .find('.badge-warning');
          if(res.message)
            badge.text(res.message);
        }

        badge.show();
        setTimeout(function() {
          badge.hide();
        }, 1500);
      },
      error: function(xhr, status, error) {
        let badge = $(event.target).closest('.actions-opts')
                                   .find('.badge-warning');
        badge.text(status);
        badge.show();
        setTimeout(function() {
          badge.hide();
        }, 1500);
      },
    });
  });

  $('.btn-trash').click(function(event) {
    let row = $(event.target).parents('tr');
    let id = row.data('deviceid');
    $.ajax({
      url: '/devicelist/delete/' + id,
      type: 'post',
      success: function(res) {
        setTimeout(function() {
          window.location.reload();
        }, 100);
      },
    });
  });

  $('.toggle-pass').click(function(event) {
    let inputField = $(event.target).closest('.input-group').find('input');
    if (inputField.attr('type') == 'text') {
      inputField.attr('type', 'password');
      $(this).children().removeClass('fa-eye').addClass('fa-eye-slash');
    } else {
      inputField.attr('type', 'text');
      $(this).children().removeClass('fa-eye-slash').addClass('fa-eye');
    }
  });

  $('.btn-log-modal').click(function(event) {
    let row = $(event.target).parents('tr');
    let id = row.data('deviceid');

    $('#logRouterid_label').text(id);
    $('#analyse-logs').modal('show');
  });

  $('.btn-log-live').click(function(event) {
    let textarea = $('#logArea');
    let id = $('#logRouterid_label').text();
    $.ajax({
      url: '/devicelist/command/' + id + '/log',
      type: 'post',
      dataType: 'json',
      success: function(res) {
        let badge;
        if(res.success) {
          textarea.html('Aguardando resposta do roteador...');
        } else {
          textarea.html(res.message);
        }
      },
      error: function(xhr, status, error) {
        textarea.html(status+': '+error);
      },
    });
  });

  $('.btn-log-upgrade').click(function(event) {
    printLogData('/devicelist/uifirstlog/');
  });

  $('.btn-log-init').click(function(event) {
    printLogData('/devicelist/uilastlog/');
  });

});
