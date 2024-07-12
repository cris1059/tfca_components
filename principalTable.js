function cargarDatosTabla() {
    let listaEmpleados = obtenerListaEmpleados();
    let paginaActual = localStorage.getItem("paginaActual");
    localStorage.removeItem('paginaActual');
    localStorage.removeItem('empleadoSeleccionado');

    if ($.fn.dataTable.isDataTable('#employees-table')) {
        let table = $('#employees-table').DataTable();
        table.clear();
        table.rows.add(listaEmpleados).draw();

        if (paginaActual !== undefined && paginaActual !== null) {
            paginaActual = parseInt(paginaActual);
            if (!isNaN(paginaActual)) {
                window.setTimeout(() => {
                    table.page(paginaActual).draw('page');
                }, 1);
            }
        }
    } else {
        $('#employees-table').DataTable({
            "scrollX": true,
            "scrollCollapse": true,
            "autoWidth": false,
            "ordering": false,
            language: {
                url: '../dist/js/pages/datatable/spanish.json'
            },
            data: listaEmpleados,
            columns: [
                { title: "N° Empleado", data: "idSegob" },
                { title: "Nombre", data: "nombre" },
                { title: "Departamento", data: "departamento" },
                { title: "Género", data: "genero" },
                { title: "Estatus", data: "estatus" },
                { title: "Opciones", data: "opciones" }
            ]
        });
    }

    let tablaResponsiva = setInterval(() => {
        if ($(".dt-layout-table").length > 0) {
            $(".dt-layout-table").addClass('table-responsive');
            clearInterval(tablaResponsiva);
        }
    }, 1);
}


function obtenerListaEmpleados () {
    const iconosUrl = './assets/images/';
    let logoDatosGenerales = insertarIcono('datos_generales','Datos generales',iconosUrl);
    let logoDomicilio = insertarIcono('domicilio','Domicilio',iconosUrl);
    let logoHorario = insertarIcono('horario','Horario',iconosUrl);
    let logoFamiliares = insertarIcono('familiares','Familiares',iconosUrl);
    let empleados;
    $.ajax({data: {function: 'loadEmployeesData'},url: '../API/HumanResourcesConnector.php',type: 'POST',dataType: 'json',async: false,success: resp => {empleados = resp;},error: function (jqXHR, exception) {console.log(jqXHR);console.log(exception);}});

    if (!empleados.success) {
        $.confirm({
            title: `Error ${empleados.error.code}`,
            content: empleados.error.description,
            buttons: {
                accept: {
                    text: 'Aceptar',
                    btnClass: 'btn btn-outline-success'
                }
            }
        });

        return false;
    }

    listaEmpleados = empleados.data.map(employee => {
        let options = `<div class="employee-options">`;
    
        options += `<div class="employee-options__general-data-container"><button class="option-button general-data" id="general" title="Datos Generales" value="${employee.employeeId}">${logoDatosGenerales}</button></div>`;
        options += `<div class="employee-options__address-data-container"><button class="option-button address-data" id="address" title="Domicilio y contacto" value="${employee.employeeId}">${logoDomicilio}</button></div>`;
        options += `<div class="employee-options__schedule-data-container"><button class="option-button schedule-data" id="schedule" title="Horario" value="${employee.employeeId}">${logoHorario}</button></div>`;
        options += `<div class="employee-options__family-data-container"><button class="option-button family-data" id="family" title="Familiares" value="${employee.employeeId}">${logoFamiliares}</button></div>`;
        options += '</div>';
    
        return {
            'idSegob': employee.segobId,
            'nombre': employee.fullName,
            'departamento': employee.department,
            'genero': employee.gender,
            'estatus': employee.status,
            'opciones': options
        }
    });

    return listaEmpleados;
}

function cargarEstadoNacimiento (codigo) {
    let estado;

    $.ajax({data: {function: 'loadPlaceBirth',code: codigo},url: '../API/HumanResourcesConnector.php',type: 'POST',dataType: 'json',async: false,success: resp => {estado = resp;},error: function (jqXHR, exception) {console.log(jqXHR);console.log(exception);},});

    if(!estado.success) {
        $.confirm({
            title: `Error ${estado.error.code}`,
            content: estado.error.description,
            buttons: {
                reload: {
                    text: 'Recargar página',
                    btnClass: 'btn btn-outline-secondary',
                    action: function () {
                        location.href = './employees_administration.html';
                    }
                }
            }
        });

        return false;
    }

    return estado.data.state;
}

function guardarFotografia (segob) {
    let formData = new FormData();
    let file = $('#photo')[0].files[0];

    formData.append("function",'saveEmployeePhoto');
    formData.append("segob",segob);
    formData.append("photo",file);

    $.ajax({data: formData,url: '../API/HumanResourcesConnector.php',type: 'POST',contentType: false,processData: false,dataType: 'json',async: true,
        success: resp => {
            if(resp.success) {
                $.confirm({title: resp.data.title,content: resp.data.description,buttons: {accept:{text: 'Aceptar',btnClass: 'btn btn-outline-success',
                            action: function () {
                                $('#photo-container').html(`<img class="img-fluid" src="./Fotografias/${$('#segob').val()}.JPG" alt="Foto del empleado">`);
                            }
                }}});
            } else {
                $.confirm({title: `Error ${resp.error.code}`,content: resp.error.description,buttons: {accept:{text: 'Aceptar',btnClass: 'btn btn-outline-success'}}});
            }
        },error: function (jqXHR, exception) {console.log(jqXHR);console.log(exception);}
    });
}

function cargarFormularioDatosGenerales () {
    $.ajax({
        url: './requires/employees_administration/general_data_editor.html',
        type: 'GET',
        async: true,
        success: resp => {
            mostrarPopupFormulario(resp,'prepararActualizacionDatosGenerales');
		},
    });
}

function cargarFormularioContacto () {
    $.ajax({
        url: './requires/employees_administration/employees_address_data_view.html',
        type: 'GET',
        async: true,
        success: resp => {
            mostrarPopupFormulario(resp,'prepararActualizacionContacto');
        }
    });
}

function cargarFormularioHorario () {
    $.ajax({
        url: './requires/employees_administration/employees_schedule_data_view.html',
        type: 'GET',
        async: true,
        success: resp => {
            mostrarPopupFormulario(resp,'prepararActualizacionHorario');
        }
    });
}

function cargarTablaFamiliares () {
    $.ajax({
        url: './requires/employees_administration/employees_family_data_view.html',
        type: 'GET',
        async: true,
        success: resp => {
            mostrarPopupTabla(resp);
        }
    });
}

function mostrarPopupTabla (form) {
    $.confirm({
        title: '',
        content: form,
        columnClass: 'col-md-12',
        containerFluid: true,
        buttons: {
            new: {
                text: `${insertarIcono('agregar-persona','')} Nuevo familiar`,
                btnClass: 'btn btn-outline-success',
                action: function () {
                    let paginaActual = $('#family-data-table').DataTable().page();

                    localStorage.setItem('paginaActualFamiliares', paginaActual);

                    cargarFormularioNuevoFamiliar();

                    return false;
                }
            },
            cancel: {
                text: 'Cerrar',
                btnClass: 'btn btn-outline-secondary',
                action: function () {
                    localStorage.removeItem('empleadoSeleccionado');
                    cargarDatosTabla();
                }
            }
        },
    });
}

function mostrarPopupFormulario (form, submitFunction) {
    $.confirm({
        title: '',
        content: form,
        columnClass: 'col-md-12',
        containerFluid: true,
        buttons: {
            formSubmit: {
                text: 'Actualizar datos',
                btnClass: 'btn btn-outline-success',
                action: function () {
                    let idEmpleado = localStorage.getItem('empleadoSeleccionado');
                    localStorage.removeItem('empleadoSeleccionado');

                    let datos = window[submitFunction](idEmpleado);

                    return actualizar(datos, 'cargarDatosTabla');
                }
            },
            cancel: {
                text: 'Cancelar',
                btnClass: 'btn btn-outline-secondary',
                action: function () {
                    localStorage.removeItem('empleadoSeleccionado');
                    localStorage.removeItem('paginaActual');
                }
            }
        },
    });
}

function actualizar (datos, tableFunction, parametro = undefined) {
    $.ajax({data: datos,url: '../API/HumanResourcesConnector.php',type: 'POST',dataType: 'json',async: true,
        success: resp => {
            if(resp.success) {
                $.confirm({title: 'Actualización exitosa.',content: resp.data,buttons: {accept: {text: 'Aceptar',btnClass: 'btn btn-outline-success',action: function () {

                    window[tableFunction](parametro);
                }}}});

                return true;
            } else {
                $.confirm({title: `Error ${resp.error.code}`,content: resp.error.description,buttons: {accept:{text: 'Aceptar',btnClass: 'btn btn-outline-success'}}});

                return false;
            }
        },error: (jqXHR, exception) => {console.log(jqXHR);console.log(exception);}
    });
}

$('#employees-table').ready(() => {
    cargarDatosTabla();


    $(document).on('change', '.toggle-vis', function() {
        let columnIdx = parseInt($(this).data('column'));
        let table = $('#employees-table').DataTable();
        table.column(columnIdx).visible(this.checked);
    });

    $('#employees-table tbody').on('click', 'button.general-data', function() {
        let paginaActual = $('#employees-table').DataTable().page();
        localStorage.setItem("paginaActual", paginaActual);
        localStorage.setItem("empleadoSeleccionado", $(this).val());
        cargarFormularioDatosGenerales();
    });

    $('#employees-table tbody').on('click', 'button.address-data', function() {
        let paginaActual = $('#employees-table').DataTable().page();
        localStorage.setItem('paginaActual', paginaActual);
        localStorage.setItem('empleadoSeleccionado', $(this).val());
        cargarFormularioContacto();
    });

    $('#employees-table tbody').on('click', 'button.schedule-data', function() {
        let paginaActual = $('#employees-table').DataTable().page();
        localStorage.setItem('paginaActual', paginaActual);
        localStorage.setItem('empleadoSeleccionado', $(this).val());
        cargarFormularioHorario();
    });

    $('#employees-table tbody').on('click', 'button.family-data', function() {
        let paginaActual = $('#employees-table').DataTable().page();
        localStorage.setItem('paginaActual', paginaActual);
        localStorage.setItem('empleadoSeleccionado', $(this).val());
        cargarTablaFamiliares();
    });
});
