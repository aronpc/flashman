
$(document).ready(function() {
  let selectedItens = [];
  let selectedNames = [];

  $('#btn-roles-trash').click(function(event) {
    $.ajax({
      type: 'POST',
      url: '/user/role/del',
      traditional: true,
      data: {ids: selectedItens, names: selectedNames},
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
  $(document).on('click', '.btn-role-edit', function(event) {
    let roleid = $(this).data('roleid');
    window.location.href = '/user/role/' + roleid;
  });

  $(document).on('change', '.checkbox', function(event) {
    let itemId = $(this).prop('id');
    let itemName = $(this).data('name');
    if (itemId == 'checkall') {
      $('.checkbox').not(this).prop('checked', this.checked).change();
    } else {
      let itemIdx = selectedItens.indexOf(itemId);
      if ($(this).is(':checked')) {
        if (itemIdx == -1) {
          selectedItens.push(itemId);
          selectedNames.push(itemName);
        }
      } else {
        if (itemIdx != -1) {
          selectedItens.splice(itemIdx, 1);
          selectedNames.splice(itemIdx, 1);
        }
      }
    }
  });

  // Handle new roles
  $('#new-role-form').submit(function(event) {
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

  $.get('/user/role/get/all', function(res) {
    if (res.type == 'success') {
      $('#loading-roles').hide();
      $('#roles-table-wrapper').show();

      res.roles.forEach(function(roleObj) {
        $('#roles-table-content').append(
          $('<tr></tr>').append(
            $('<td></td>').addClass('col-xs-1').append(
              $('<input></input>').addClass('checkbox')
              .attr('type', 'checkbox')
              .attr('id', roleObj._id)
              .attr('data-name', roleObj.name)
            ),
            $('<td></td>').addClass('text-center').html(roleObj.name),
            $('<td></td>').addClass('text-center').append(
              $('<button></button>').append(
                $('<div></div>').addClass('fas fa-edit btn-role-edit-icon'),
                $('<span></span>').html('&nbsp Editar')
              ).addClass('btn btn-sm my-0 teal lighten-2 btn-role-edit')
              .attr('data-roleid', roleObj._id)
              .attr('type', 'button')
            )
          )
        );
      });

      $('#roles-table').DataTable({
        'destroy': true,
        'paging': true,
        'info': false,
        'pagingType': 'numbers',
        'language': {
          'zeroRecords': 'Nenhum classe de permissões encontrada',
          'infoEmpty': 'Nenhum classe de permissões encontrada',
          'search': 'Buscar',
          'lengthMenu': 'Exibir _MENU_',
        },
      });
    } else {
      displayAlertMsg({
        type: res.type,
        message: res.message,
      });
    }
  }, 'json');
});
