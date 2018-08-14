
let check = function(input) {
  if (input.value != document.getElementById('new_pass').value) {
    input.setCustomValidity('As senhas estão diferentes');
  } else {
    input.setCustomValidity('');
  }
};

$(document).ready(function() {
  let selectedItens = [];

  $('#btn-user-trash').click(function(event) {
    $.ajax({
      type: 'POST',
      url: '/user/del',
      traditional: true,
      data: {ids: selectedItens},
      success: function(res) {
        if (res.type == 'success') {
          displayAlertMsg(res);
          setTimeout(function() {
            window.location.reload();
          }, 1000);
        } else {
          displayAlertMsg(res);
        }
      },
    });
  });

  // Use this format when adding button with AJAX
  $(document).on('click', '.btn-usr-edit', function(event) {
    let userid = $(this).data('userid');
    window.location.href = '/user/profile/' + userid;
  });

  $(document).on('change', '.checkbox', function(event) {
    let itemId = $(this).prop('id');
    if (itemId == 'checkall') {
      $('.checkbox').not(this).prop('checked', this.checked).change();
    } else {
      let itemIdx = selectedItens.indexOf(itemId);
      if ($(this).is(':checked')) {
        if (itemIdx == -1) {
          selectedItens.push(itemId);
        }
      } else {
        if (itemIdx != -1) {
          selectedItens.splice(itemIdx, 1);
        }
      }
    }
  });

  // Handle new users
  $('#new-user-form').submit(function(event) {
    if ($(this)[0].checkValidity()) {
      $.post($(this).attr('action'), $(this).serialize(), function(res) {
        displayAlertMsg(res);
        if (res.type == 'success') {
          setTimeout(function() {
            window.location.reload();
          }, 2000);
        }
      }, 'json');
    } else {
      event.preventDefault();
      event.stopPropagation();
    }
    $(this).addClass('was-validated');
    return false;
  });

  $.get('/user/get/all', function(res) {
    if (res.type == 'success') {
      $('#loading-users').hide();
      $('#users-table-wrapper').show();

      res.users.forEach(function(userObj) {
        $('#users-table-content').append(
          $('<tr></tr>').append(
            (userObj.is_superuser ?
              $('<td></td>') :
              $('<td></td>').addClass('col-xs-1').append(
                $('<input></input>').addClass('checkbox')
                .attr('type', 'checkbox')
                .attr('id', userObj._id)
              )
            ),
            $('<td></td>').addClass('text-center').html(userObj.name),
            $('<td></td>').addClass('text-center').html(userObj.createdAt),
            $('<td></td>').addClass('text-center').append(
              $('<button></button>').append(
                $('<div></div>').addClass('fas fa-edit btn-usr-edit-icon'),
                $('<span></span>').html('&nbsp Editar')
              ).addClass('btn btn-sm my-0 teal lighten-2 btn-usr-edit')
              .attr('data-userid', userObj._id)
              .attr('type', 'button')
            )
          )
        );
      });

      $('#users-table').DataTable({
        'destroy': true,
        'paging': true,
        'info': false,
        'pagingType': 'numbers',
        'language': {
          'zeroRecords': 'Nenhum usuário encontrado',
          'infoEmpty': 'Nenhum usuário encontrado',
          'search': 'Buscar',
          'lengthMenu': 'Exibir _MENU_ usuários',
        },
        'order': [[1, 'asc'], [2, 'asc']],
      });
    } else {
      displayAlertMsg({
        type: res.type,
        message: res.message,
      });
    }
  }, 'json');
});
